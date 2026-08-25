# Composites assets/avz/tileset.png from the ChaoticCherryCake source sheet.
#
# The old 48-tile sheet was hand-picked in GIMP and had no edge tiles at all,
# which is why every terrain boundary rendered as a hard 32px staircase. The
# source sheet is laid out as RPG-Maker-style 3x3 nine-slice autotile blocks
# (corners / edges / centre), so we can lift whole blocks and let build_map.py
# pick the right slice per cell instead of stamping one flat fill everywhere.
#
# Source sheet is NOT committed (see ../../.gitignore) — it is the full
# third-party sheet and only the composited subset ships. Recover it with:
#   git -C ../../../mirrorsky cat-file -p 1c3da580 > source/ccc-tileset-32.png
#
# Run:  python3 build_tileset.py
import json
import os
from PIL import Image

_HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(_HERE, 'source', 'ccc-tileset-32.png')
OUT_PNG = os.path.join(_HERE, '..', '..', 'assets', 'avz', 'tileset.png')
OUT_IDX = os.path.join(_HERE, 'tileset_index.json')

TS = 32
OUT_COLS = 12  # output sheet width in tiles

# --- Nine-slice terrain blocks -------------------------------------------------
# (col, row) is the TOP-LEFT tile of a 3x3 block in the source sheet.
# Slice order emitted: NW N NE W C E SW S SE
NINE_SLICE = {
    'grass':      (3, 166),   # grass centre with earth border
    'water':      (0, 173),   # deep blue-teal river
    'shallow':    (0, 166),   # pale blue, for river margins
    'path':       (3, 173),   # tan dirt/gravel path
    'gravel':     (0, 169),   # grey stone
    'earth':      (3, 169),   # dark bare earth
}

# --- Multi-tile decoration stamps ----------------------------------------------
# (col, row, width, height) in the source sheet.
STAMPS = {
    # Deciduous canopies suit a Normandy river estate; the sheet's palms and
    # cacti are deliberately left out. Coordinates verified tile-by-tile against
    # the source sheet — a stamp that is one column out grabs the neighbouring
    # sprite and renders as confetti, which is exactly what happened first pass.
    'tree_leafy':   (0, 48, 2, 2),
    'tree_round':   (6, 46, 2, 2),
    'tree_broad':   (3, 48, 2, 2),
    'tree_conifer': (0, 40, 1, 2),
    'tree_dead':    (2, 46, 2, 2),
    'bush_small':   (2, 48, 1, 2),
    'log':          (6, 50, 1, 1),
    'stump':        (7, 50, 1, 1),
}

# --- Horizontally stretchable buildings ----------------------------------------
# The cadastral footprints are real and wide (the main house is 12 tiles across),
# so a fixed house sprite can never fit them. These blocks are authored as
# left edge | repeatable middle | right edge, which lets build_map.py stretch
# one building across whatever width the plan actually says.
# (col, row, total_w, h, n_left, n_right) -- middle is whatever is between.
H_STRETCH = {
    'manor': (0, 506, 4, 3, 1, 1),
    # Stone bridge: upper rail / deck / lower rail, abutments at each end and a
    # repeatable span between. Used for the crossing to the island.
    'bridge': (0, 331, 8, 3, 1, 1),
}

# --- Whole-sprite buildings ----------------------------------------------------
BUILDINGS = {
    'cottage_red':   (1, 423, 2, 3),
    'cottage_green': (4, 427, 2, 3),
}

# --- Single accent tiles -------------------------------------------------------
SINGLES = {
    'grass_alt':    (6, 172),
    'grass_tuft':   (7, 172),
    'water_rock':   (7, 174),
    'path_patch':   (7, 176),
}


def main():
    src = Image.open(SRC).convert('RGBA')
    sw, sh = src.size
    max_col, max_row = sw // TS, sh // TS

    def grab(c, r):
        if not (0 <= c < max_col and 0 <= r < max_row):
            raise SystemExit(f"source tile ({c},{r}) is outside the {max_col}x{max_row} sheet")
        return src.crop((c * TS, r * TS, (c + 1) * TS, (r + 1) * TS))

    tiles = []          # list of PIL images, index == tile id
    index = {'nine_slice': {}, 'stamps': {}, 'singles': {}, 'tile_size': TS}

    def add(img):
        tiles.append(img)
        return len(tiles) - 1

    # tile id 0 is reserved: Tiled treats gid 0 as "empty", so keep a blank here
    # and let every real tile start at id 1 (gid 2). Costs one tile, removes a
    # whole class of off-by-one bugs.
    add(Image.new('RGBA', (TS, TS), (0, 0, 0, 0)))

    for name, (c0, r0) in NINE_SLICE.items():
        ids = [add(grab(c0 + dc, r0 + dr)) for dr in range(3) for dc in range(3)]
        index['nine_slice'][name] = ids   # NW N NE W C E SW S SE

    for name, (c0, r0, w, h) in STAMPS.items():
        ids = [[add(grab(c0 + dc, r0 + dr)) for dc in range(w)] for dr in range(h)]
        index['stamps'][name] = {'w': w, 'h': h, 'ids': ids}

    index['h_stretch'] = {}
    for name, (c0, r0, w, h, nl, nr) in H_STRETCH.items():
        left  = [[add(grab(c0 + dc, r0 + dr)) for dc in range(nl)] for dr in range(h)]
        mid   = [[add(grab(c0 + dc, r0 + dr)) for dc in range(nl, w - nr)] for dr in range(h)]
        right = [[add(grab(c0 + w - nr + dc, r0 + dr)) for dc in range(nr)] for dr in range(h)]
        index['h_stretch'][name] = {'h': h, 'left': left, 'mid': mid, 'right': right}

    index['buildings'] = {}
    for name, (c0, r0, w, h) in BUILDINGS.items():
        index['buildings'][name] = {
            'w': w, 'h': h,
            'ids': [[add(grab(c0 + dc, r0 + dr)) for dc in range(w)] for dr in range(h)],
        }

    for name, (c, r) in SINGLES.items():
        index['singles'][name] = add(grab(c, r))

    rows = -(-len(tiles) // OUT_COLS)
    sheet = Image.new('RGBA', (OUT_COLS * TS, rows * TS), (0, 0, 0, 0))
    for i, img in enumerate(tiles):
        sheet.paste(img, ((i % OUT_COLS) * TS, (i // OUT_COLS) * TS), img)

    index['columns'] = OUT_COLS
    index['tilecount'] = OUT_COLS * rows
    index['imagewidth'] = sheet.size[0]
    index['imageheight'] = sheet.size[1]

    sheet.save(OUT_PNG)
    with open(OUT_IDX, 'w') as f:
        json.dump(index, f, indent=2)

    print(f"wrote {OUT_PNG} {sheet.size[0]}x{sheet.size[1]} "
          f"({OUT_COLS}x{rows} = {index['tilecount']} slots, {len(tiles)} used)")
    print(f"  nine-slice terrains: {', '.join(NINE_SLICE)}")
    print(f"  stamps: {', '.join(STAMPS)}")
    print(f"  stretchable: {', '.join(H_STRETCH)}   buildings: {', '.join(BUILDINGS)}")
    print(f"wrote {OUT_IDX}")


if __name__ == '__main__':
    main()
