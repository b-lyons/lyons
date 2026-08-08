const DIR_ROW = { up: 0, left: 1, down: 2, right: 3 };
const FRAMES_PER_ROW = 9;
const SPEED = 140;

export class EstateScene extends Phaser.Scene {
  constructor() {
    super('EstateScene');
    this.facing = 'down';
  }

  preload() {
    this.load.image('tileset', 'assets/estate/tileset.png');
    this.load.tilemapTiledJSON('estate-map', 'assets/estate/estate-map.json');
    this.load.spritesheet('player', 'assets/estate/player.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create() {
    this.map = this.make.tilemap({ key: 'estate-map' });
    const tileset = this.map.addTilesetImage('estate_tileset', 'tileset');
    this.groundLayer = this.map.createLayer('Ground', tileset, 0, 0);
    this.groundLayer.setCollisionByProperty({ collides: true });

    // Building sits on its own layer above Ground: most of its tiles are
    // partially transparent roof/wall silhouettes, so they need grass
    // showing through underneath rather than a black void.
    this.buildingLayer = this.map.createLayer('Building', tileset, 0, 0);
    this.buildingLayer.setCollisionByProperty({ collides: true });

    const spawnPoint = this.map.findObject(
      'Objects',
      (obj) => obj.name === 'Spawn Point'
    );

    this.player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, 'player', DIR_ROW.down * FRAMES_PER_ROW);
    this.player.body.setSize(20, 18);
    this.player.body.setOffset(22, 42);
    this.player.setCollideWorldBounds(true);

    this.physics.add.collider(this.player, this.groundLayer);
    this.physics.add.collider(this.player, this.buildingLayer);

    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.startFollow(this.player, true);
    this.cameras.main.setZoom(2);

    this.createAnimations();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
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
    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;

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
