# Renders assets/avz/avz-map.json to a PNG so the map can be eyeballed without
# booting the game. Visual work needs looking at, and the browser canvas is
# awkward to screenshot reliably.
#   python3 render_preview.py [out.png] [x0 y0 w h]
import json, os, sys
from PIL import Image

_HERE = os.path.dirname(os.path.abspath(__file__))
MAP = os.path.join(_HERE, '..', '..', 'assets', 'avz', 'avz-map.json')
TS_IMG = os.path.join(_HERE, '..', '..', 'assets', 'avz', 'tileset.png')

out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(_HERE, 'preview.png')
crop = [int(v) for v in sys.argv[2:6]] if len(sys.argv) >= 6 else None

m = json.load(open(MAP))
W, H, TS = m['width'], m['height'], m['tilewidth']
ts = m['tilesets'][0]
sheet = Image.open(TS_IMG).convert('RGBA')
cols = ts['columns']

def tile(gid):
    i = gid - ts['firstgid']
    c, r = i % cols, i // cols
    return sheet.crop((c * TS, r * TS, (c + 1) * TS, (r + 1) * TS))

x0, y0, w, h = crop if crop else (0, 0, W, H)
canvas = Image.new('RGBA', (w * TS, h * TS), (20, 20, 30, 255))
drawn = 0
for layer in m['layers']:
    if layer['type'] != 'tilelayer' or layer['name'] == 'CollisionLayer':
        continue
    d = layer['data']
    for y in range(y0, min(y0 + h, H)):
        for x in range(x0, min(x0 + w, W)):
            gid = d[y * W + x]
            if not gid: continue
            t = tile(gid)
            canvas.paste(t, ((x - x0) * TS, (y - y0) * TS), t)
            drawn += 1
canvas.save(out)
print(f"wrote {out} {canvas.size[0]}x{canvas.size[1]} ({drawn} tiles drawn, region {x0},{y0} {w}x{h})")
