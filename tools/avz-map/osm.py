# OpenStreetMap ingestion for the AVZ map.
#
# The cadastral plan only classifies LAND / WATER / BUILDING, so everything else
# in build_map.py -- pool, tennis court, driveway, garden loop -- was hand-located
# by eye against the aerial photo. OSM carries real vector geometry for water,
# roads, tracks, footways, landuse and building footprints, so those features can
# come from data instead of from constants.
#
# The Overpass response is cached on disk (and gitignored): it pins the property's
# location, and we shouldn't hammer a volunteer-run API on every regeneration.
import json
import os
import urllib.request

import proj

_HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(_HERE, 'osm_cache.json')
ENDPOINT = 'https://overpass-api.de/api/interpreter'

# Generous enough to cover the padded 132x132 grid (330 m) with margin.
BBOX = (48.2265, 0.6725, 48.2310, 0.6790)   # S, W, N, E

QUERY = """[out:json][timeout:90];
(
  way({s},{w},{n},{e});
  relation({s},{w},{n},{e});
);
out geom;
"""


def fetch(force=False):
    if os.path.exists(CACHE) and not force:
        with open(CACHE) as f:
            return json.load(f)
    s, w, n, e = BBOX
    body = QUERY.format(s=s, w=w, n=n, e=e).encode()
    req = urllib.request.Request(ENDPOINT, data=body,
                                 headers={'User-Agent': 'avz-map-builder/1.0 (lyons.io)'})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = json.load(r)
    with open(CACHE, 'w') as f:
        json.dump(data, f)
    return data


def grid_mapper(meta):
    """Return lat,lon -> (gx, gy) float grid coords, matching world_to_grid()."""
    XMIN, YMAX, TILE_M = meta['XMIN'], meta['YMAX'], meta['TILE_M']
    PAD_X, PAD_Y = meta['padX'], meta['padY']
    K = complex(meta['K_re'], meta['K_im'])
    OFF = complex(meta['Offset_re'], meta['Offset_im'])

    def to_grid(lat, lon):
        X, Y = proj.wgs84_to_cc48(lat, lon)
        old_c, old_r = (X - XMIN) / TILE_M, (YMAX - Y) / TILE_M
        g = (complex(old_c, old_r) - OFF / 15.5) / K
        return (g.real + PAD_X, g.imag + PAD_Y)

    return to_grid


def fill_polygon(pts, W, H):
    """Even-odd scanline fill. pts: [(x, y)] in grid coords."""
    if len(pts) < 3:
        return set()
    cells = set()
    ys = [p[1] for p in pts]
    y0 = max(0, int(min(ys)))
    y1 = min(H - 1, int(max(ys)) + 1)
    for gy in range(y0, y1 + 1):
        yc = gy + 0.5
        xs = []
        for i in range(len(pts)):
            ax, ay = pts[i]
            bx, by = pts[(i + 1) % len(pts)]
            if (ay <= yc < by) or (by <= yc < ay):
                xs.append(ax + (yc - ay) * (bx - ax) / (by - ay))
        xs.sort()
        for i in range(0, len(xs) - 1, 2):
            for gx in range(max(0, int(xs[i])), min(W - 1, int(xs[i + 1])) + 1):
                cells.add((gx, gy))
    return cells


def stroke_line(pts, W, H, radius=1.0):
    """Rasterise a polyline with a round brush of `radius` tiles."""
    cells = set()
    r = int(radius) + 1
    for i in range(len(pts) - 1):
        ax, ay = pts[i]
        bx, by = pts[i + 1]
        steps = max(2, int(max(abs(bx - ax), abs(by - ay)) * 3) + 1)
        for s in range(steps + 1):
            t = s / steps
            cx, cy = ax + (bx - ax) * t, ay + (by - ay) * t
            for dy in range(-r, r + 1):
                for dx in range(-r, r + 1):
                    if dx * dx + dy * dy > radius * radius:
                        continue
                    gx, gy = int(cx) + dx, int(cy) + dy
                    if 0 <= gx < W and 0 <= gy < H:
                        cells.add((gx, gy))
    return cells


def classify(data, meta, W, H):
    """Rasterise the OSM extract into named cell sets on the cadastral grid."""
    to_grid = grid_mapper(meta)
    out = {k: set() for k in ('water', 'meadow', 'farmland', 'building',
                              'road', 'track', 'footway', 'bridge', 'pitch')}

    for el in data.get('elements', []):
        t = el.get('tags', {}) or {}
        geom = el.get('geometry')
        if not geom:
            continue
        pts = [to_grid(p['lat'], p['lon']) for p in geom if p.get('lat') is not None]
        if len(pts) < 2:
            continue

        hw = t.get('highway')
        if t.get('natural') == 'water' or t.get('waterway') in ('riverbank',):
            out['water'] |= fill_polygon(pts, W, H)
        elif t.get('waterway') == 'river':
            out['water'] |= stroke_line(pts, W, H, radius=2.0)
        elif t.get('landuse') == 'meadow':
            out['meadow'] |= fill_polygon(pts, W, H)
        elif t.get('landuse') == 'farmland':
            out['farmland'] |= fill_polygon(pts, W, H)
        elif t.get('leisure') == 'pitch':
            out['pitch'] |= fill_polygon(pts, W, H)
        elif 'building' in t:
            out['building'] |= fill_polygon(pts, W, H)
        elif hw:
            if t.get('bridge'):
                out['bridge'] |= stroke_line(pts, W, H, radius=1.4)
            if hw in ('tertiary', 'residential', 'unclassified', 'secondary'):
                out['road'] |= stroke_line(pts, W, H, radius=1.4)
            elif hw in ('service', 'track'):
                out['track'] |= stroke_line(pts, W, H, radius=1.0)
            elif hw in ('footway', 'path'):
                out['footway'] |= stroke_line(pts, W, H, radius=0.7)

    return out
