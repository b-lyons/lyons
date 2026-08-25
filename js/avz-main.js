import { EstateScene } from './avz-scene.js';

const boot = document.getElementById('boot');
const bootLabel = document.getElementById('boot-label');
const bootMsg = document.getElementById('boot-msg');
const bootFill = document.getElementById('boot-bar-fill');
const bootBack = document.getElementById('boot-back');
const container = document.getElementById('game-container');

function fail(message) {
  bootLabel.textContent = 'COULD NOT LOAD';
  bootMsg.textContent = message;
  bootFill.parentElement.hidden = true;
  bootBack.hidden = false;
  boot.classList.remove('is-done');
  boot.hidden = false;
}

// The inline check in avz/index.html already reported a missing Phaser.
if (!window.Phaser) throw new Error('Phaser failed to load');

const scene = new EstateScene({
  onProgress(value) {
    bootFill.style.width = `${Math.round(value * 100)}%`;
  },
  onError(src) {
    fail(`A map asset failed to load (${src}). Reload to try again.`);
  },
  onReady(sceneRef) {
    boot.classList.add('is-done');
    setTimeout(() => { boot.hidden = true; }, 300);
    container.focus({ preventScroll: true });
    wireDpad(sceneRef);
  },
});

window.game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [scene],
});

// Anything thrown during create() (a malformed tilemap, a renamed layer) would
// otherwise surface only in the console, behind a black canvas.
window.addEventListener('error', (e) => {
  if (!boot.hidden) fail(`The map could not be built: ${e.message}`);
});

/** Pointer-driven d-pad, mirroring the keyboard flags the scene already reads. */
function wireDpad(sceneRef) {
  const dpad = document.getElementById('dpad');
  if (!dpad) return;

  dpad.querySelectorAll('.dpad-btn').forEach((btn) => {
    const dir = btn.dataset.dir;
    const press = (on) => (e) => {
      e.preventDefault();
      btn.classList.toggle('is-active', on);
      sceneRef.setTouchDir(dir, on);
      if (on) btn.setPointerCapture?.(e.pointerId);
    };
    btn.addEventListener('pointerdown', press(true));
    btn.addEventListener('pointerup', press(false));
    btn.addEventListener('pointercancel', press(false));
    btn.addEventListener('pointerleave', press(false));
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  });
}
