# Turns a per-cell terrain classification into the layered, autotiled Tiled
# layers the game actually renders.
#
# The old export wrote one flat fill per terrain straight onto a single Ground
# layer, so every boundary came out as a hard 32px staircase. Here each terrain
# is a 3x3 nine-slice (see build_tileset.py) and we pick the slice from the
# cell's four orthogonal neighbours, which is what produces rounded shorelines
# and blended path edges.
#
# Layer scheme mirrors the one used by well-built Phaser overworlds:
#   Ground1        opaque base fill, never empty
#   Ground2        autotiled terrain on top of the base
#   Deco           props and the lower half of tree stamps (behind the player)
#   Above          upper half of tree stamps (drawn OVER the player, depth 10)
#   CollisionLayer invisible solid markers
import json
import os

_HERE = os.path.dirname(os.path.abspath(__file__))

# Nine-slice order as emitted by build_tileset.py
NW, N, NE, W, C, E, SW, S, SE = range(9)


def load_index():
    with open(os.path.join(_HERE, 'tileset_index.json')) as f:
        return json.load(f)


def nine_slice_pick(inside, x, y, w, h):
    """Pick the nine-slice index for a cell, from its 4 orthogonal neighbours.

    Cells outside the grid count as 'inside' so terrain running off the map
    edge doesn't grow a spurious border along the boundary.
    """
    def q(cx, cy):
        if cx < 0 or cy < 0 or cx >= w or cy >= h:
            return True
        return inside(cx, cy)

    n, s = q(x, y - 1), q(x, y + 1)
    e, ww = q(x + 1, y), q(x - 1, y)

    if not n and not ww: return NW
    if not n and not e:  return NE
    if not s and not ww: return SW
    if not s and not e:  return SE
    if not n:            return N
    if not s:            return S
    if not ww:           return W
    if not e:            return E
    return C


def autotile(mask, w, h, ids):
    """mask: set of (x,y) cells belonging to this terrain. Returns {(x,y): tile_id}."""
    inside = lambda cx, cy: (cx, cy) in mask
    return {(x, y): ids[nine_slice_pick(inside, x, y, w, h)] for (x, y) in mask}


def place_stamps(spots, stamp, w, h, occupied):
    """Place multi-tile stamps at `spots`, skipping any that would overlap.

    Returns (lower_half, upper_half) as {(x,y): tile_id}. The upper half goes on
    the Above layer so the player can walk behind a tree canopy.
    """
    sw, sh = stamp['w'], stamp['h']
    lower, upper, trunks = {}, {}, set()
    split = sh // 2 if sh > 1 else 0   # rows above `split` render over the player

    for (ox, oy) in spots:
        cells = [(ox + dx, oy + dy) for dy in range(sh) for dx in range(sw)]
        if any(c in occupied for c in cells): continue
        if any(cx < 0 or cy < 0 or cx >= w or cy >= h for cx, cy in cells): continue

        for dy in range(sh):
            for dx in range(sw):
                tid = stamp['ids'][dy][dx]
                target = upper if dy < split else lower
                target[(ox + dx, oy + dy)] = tid
        occupied.update(cells)

        # Only the trunk blocks. Making the whole footprint solid would turn a
        # 3x4 specimen into a 3x2 wall you have to walk around, when what the
        # player sees is a trunk they should bump into and a canopy they pass
        # under. Bottom row, middle third of the width.
        base_y = oy + sh - 1
        lo_x = ox + (sw - 1) // 3 if sw >= 3 else ox
        hi_x = ox + sw - 1 - (sw - 1) // 3 if sw >= 3 else ox + sw - 1
        trunks.update((tx, base_y) for tx in range(lo_x, hi_x + 1))

    return lower, upper, trunks


def flatten(cells, w, h, base=0):
    """{(x,y): tile_id} -> flat Tiled gid array (gid = id + 1, 0 = empty)."""
    data = [base] * (w * h)
    for (x, y), tid in cells.items():
        data[y * w + x] = tid + 1
    return data


def stretch_building(spec, x0, y0, width):
    """Lay a left|middle|right building block across `width` tiles.

    Returns (lower, upper) like place_stamps: the top row draws over the player
    so you can walk behind the eaves, the rest is solid frontage.
    """
    h = spec['h']
    left, mid, right = spec['left'], spec['mid'], spec['right']
    nl, nr, nm = len(left[0]), len(right[0]), len(mid[0])
    width = max(width, nl + nr)
    inner = width - nl - nr

    lower, upper = {}, {}
    for dy in range(h):
        row = list(left[dy])
        for i in range(inner):
            row.append(mid[dy][i % nm])
        row += list(right[dy])
        for dx, tid in enumerate(row):
            target = upper if dy == 0 else lower
            target[(x0 + dx, y0 + dy)] = tid
    return lower, upper


def crop_layers(layers, spawn, w, h, pad=4, anchor=('Buildings',)):
    """Crop every layer to the bounding box of its interesting content.

    A 132x132 grid whose features occupy a third of it reads as an empty field;
    the reference maps are small and dense. `layers` is {name: {(x,y): id}};
    `interesting` names the layers whose extent defines the crop (a full-bleed
    grass bed would otherwise always span the whole map).
    """
    # Anchor on structures only. Keying off decoration instead would be
    # self-defeating: the tree scatter covers the whole plan, so its bounding
    # box is the whole plan and the crop becomes a no-op.
    xs, ys = [], []
    for name in anchor:
        for (x, y) in layers.get(name, {}):
            xs.append(x); ys.append(y)
    if not xs:
        return layers, spawn, 0, 0, w, h

    x0 = max(0, min(xs) - pad); x1 = min(w - 1, max(xs) + pad)
    y0 = max(0, min(ys) - pad); y1 = min(h - 1, max(ys) + pad)
    nw, nh = x1 - x0 + 1, y1 - y0 + 1

    out = {}
    for name, cells in layers.items():
        out[name] = {(x - x0, y - y0): t for (x, y), t in cells.items()
                     if x0 <= x <= x1 and y0 <= y <= y1}

    sx = min(max(spawn[0] - x0 * 32, 16), nw * 32 - 16)
    sy = min(max(spawn[1] - y0 * 32, 16), nh * 32 - 16)
    return out, (sx, sy), x0, y0, nw, nh


def stretch_building_2d(spec, x0, y0, width, height):
    """Lay a left|mid|right building block across `width` AND `height` tiles.

    The 1D version only ever covered the block's own 3 rows, so a footprint
    deeper than that left bare roof-fill showing above and below it -- the grey
    patches around the outbuildings. Growing the roof vertically and keeping a
    single facade row at the bottom fills the real cadastral footprint.
    """
    h = spec['h']
    left, mid, right = spec['left'], spec['mid'], spec['right']
    nl, nr, nm = len(left[0]), len(right[0]), len(mid[0])
    width = max(width, nl + nr)
    height = max(height, 2)
    inner = width - nl - nr

    # row 0 is the roof ridge, row h-1 the facade, everything between is roof
    def src_row(dy):
        if dy == 0:
            return 0
        if dy == height - 1:
            return h - 1
        return min(1, h - 2)

    lower, upper = {}, {}
    for dy in range(height):
        sr = src_row(dy)
        row = list(left[sr])
        for i in range(inner):
            row.append(mid[sr][i % nm])
        row += list(right[sr])
        for dx, tid in enumerate(row):
            target = upper if dy == 0 else lower
            target[(x0 + dx, y0 + dy)] = tid
    return lower, upper
