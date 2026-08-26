const DIR_ROW = { up: 0, left: 1, down: 2, right: 3 };
const FRAMES_PER_ROW = 9;
const SPEED = 140;

// Keep roughly this many tiles across the viewport at any size, so the map reads
// the same on a phone and on a 4K monitor instead of being fixed at zoom 2.
const TARGET_TILES_ACROSS = 20;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

// Used only if the map's Spawn Point object is missing or unreadable.
const FALLBACK_SPAWN = { x: 2896, y: 4144 };

// Fallback only — the real value is published as a `collisionGid` map property
// by tools/avz-map/build_map.py, so the tileset can grow without breaking this.
const FALLBACK_COLLISION_GID = 252;

export class EstateScene extends Phaser.Scene {
  constructor(hooks = {}, assetVersion = '0') {
    super('EstateScene');
    this.assetVersion = assetVersion;
    this.facing = 'down';
    this.hooks = hooks;
    this.touchDir = { up: false, down: false, left: false, right: false };
  }

  preload() {
    this.load.on('progress', (v) => this.hooks.onProgress?.(v));
    this.load.on('loaderror', (file) => this.hooks.onError?.(file?.src || file?.key));

    this.load.image('tileset', `/assets/avz/tileset.png?v=${this.assetVersion}`);
    this.load.tilemapTiledJSON('avz-map', `/assets/avz/avz-map.json?v=${this.assetVersion}`);
    this.load.spritesheet('player', `/assets/avz/player.png?v=${this.assetVersion}`, {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create() {
    this.map = this.make.tilemap({ key: 'avz-map' });
    const tileset = this.map.addTilesetImage('avz_tileset', 'tileset');

    // Layer stack, bottom to top. Ground1 is an opaque grass bed; Ground2 is the
    // autotiled terrain painted over it; Deco holds props and the trunk half of
    // tree stamps. Above carries the canopy half and is given a depth so the
    // player walks *behind* it — that depth cue is most of what makes a
    // top-down map read as a place rather than a diagram.
    this.map.createLayer('Ground1', tileset, 0, 0);
    this.map.createLayer('Ground2', tileset, 0, 0);
    this.map.createLayer('Deco', tileset, 0, 0);
    this.map.createLayer('Above', tileset, 0, 0).setDepth(10);

    // Collision lives on one invisible marker tile rather than per-tile
    // properties: far easier to author and to generate than tagging every
    // solid tile in a shared tileset.
    this.collisionLayer = this.map.createLayer('CollisionLayer', tileset, 0, 0);
    this.collisionLayer.setVisible(false);
    const published = this.map.properties?.find?.((p) => p.name === 'collisionGid')?.value;
    if (published === undefined) {
      // Silently using a stale constant here shows up as "collision randomly
      // stopped working", which is miserable to debug. Say so instead.
      console.warn('avz: map published no collisionGid; falling back to', FALLBACK_COLLISION_GID);
    }
    const collisionGid = published ?? FALLBACK_COLLISION_GID;
    this.collisionLayer.setCollisionBetween(collisionGid, collisionGid);

    // A missing Objects layer or renamed object used to throw here and leave a
    // permanently black screen — fall back to a known-good spot instead.
    const spawnPoint =
      this.map.findObject('Objects', (obj) => obj.name === 'Spawn Point') || FALLBACK_SPAWN;

    this.player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, 'player', DIR_ROW.down * FRAMES_PER_ROW);
    this.player.body.setSize(20, 18);
    this.player.body.setOffset(22, 42);
    this.player.setCollideWorldBounds(true);

    this.physics.add.collider(this.player, this.collisionLayer);

    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.startFollow(this.player, true);
    this.applyZoom();
    this.scale.on('resize', this.applyZoom, this);

    this.createAnimations();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
    // Stop arrow keys and space from scrolling / activating the page behind the canvas.
    this.input.keyboard.addCapture('UP,DOWN,LEFT,RIGHT,SPACE');
    this.input.keyboard.on('keydown-ESC', () => { window.location.href = '/#work'; });

    this.hooks.onReady?.(this);
  }

  applyZoom() {
    const tileW = this.map.tileWidth;
    const zoom = Phaser.Math.Clamp(
      this.scale.width / (TARGET_TILES_ACROSS * tileW),
      MIN_ZOOM,
      MAX_ZOOM
    );
    this.cameras.main.setZoom(zoom);
  }

  /** Called by the touch d-pad in avz-main.js. */
  setTouchDir(dir, active) {
    if (dir in this.touchDir) this.touchDir[dir] = active;
  }

  createAnimations() {
    Object.entries(DIR_ROW).forEach(([dir, row]) => {
      this.anims.create({
        key: `walk-${dir}`,
        frames: this.anims.generateFrameNumbers('player', {
          start: row * FRAMES_PER_ROW,
          end: row * FRAMES_PER_ROW + FRAMES_PER_ROW - 1,
        }),
        frameRate: 12,
        repeat: -1,
      });
    });
  }

  update() {
    const t = this.touchDir;
    const left = this.cursors.left.isDown || this.wasd.A.isDown || t.left;
    const right = this.cursors.right.isDown || this.wasd.D.isDown || t.right;
    const up = this.cursors.up.isDown || this.wasd.W.isDown || t.up;
    const down = this.cursors.down.isDown || this.wasd.S.isDown || t.down;

    let vx = 0;
    let vy = 0;
    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    const moving = vx !== 0 || vy !== 0;

    if (moving) {
      const len = Math.hypot(vx, vy);
      this.player.body.setVelocity((vx / len) * SPEED, (vy / len) * SPEED);

      if (vy < 0) this.facing = 'up';
      else if (vy > 0) this.facing = 'down';
      else if (vx < 0) this.facing = 'left';
      else if (vx > 0) this.facing = 'right';

      this.player.anims.play(`walk-${this.facing}`, true);
    } else {
      this.player.body.setVelocity(0, 0);
      this.player.anims.stop();
      this.player.setFrame(DIR_ROW[this.facing] * FRAMES_PER_ROW);
    }
  }
}
