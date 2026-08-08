/**
 * 2D Ising model — Metropolis, periodic BC, canvas render (vanilla JS)
 */
(function() {
  'use strict';

  var L = 48;
  var CELL = 6;
  var T_CRITICAL = 2.269;

  var canvas = document.getElementById('ising-canvas');
  var btnToggle = document.getElementById('ising-toggle');
  var btnReset = document.getElementById('ising-reset');
  var inputTemp = document.getElementById('ising-temp');
  var elTempReadout = document.getElementById('ising-temp-readout');
  var elM = document.getElementById('ising-m');
  var elAbsM = document.getElementById('ising-absm');

  if (!canvas || !btnToggle || !btnReset || !inputTemp) return;

  var ctx = canvas.getContext('2d', { alpha: false });
  var spins = new Int8Array(L * L);
  var running = false;
  var rafId = null;
  var T = parseFloat(inputTemp.value);
  if (!isFinite(T)) T = 2.27;

  var prefersReduced =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var sweepsPerFrame = prefersReduced ? 1 : 4;

  var COLOR_UP = '#e8e6f2';
  var COLOR_DOWN = '#12121a';
  var GRID = '#2a2a3d';

  function index(i, j) {
    return i * L + j;
  }

  function wrap(x) {
    return (x + L) % L;
  }

  function sumNeighbors(i, j) {
    var ip = wrap(i - 1);
    var im = wrap(i + 1);
    var jp = wrap(j - 1);
    var jm = wrap(j + 1);
    return (
      spins[index(ip, j)] +
      spins[index(im, j)] +
      spins[index(i, jp)] +
      spins[index(i, jm)]
    );
  }

  function randomize() {
    var k;
    for (k = 0; k < L * L; k++) {
      spins[k] = Math.random() < 0.5 ? 1 : -1;
    }
  }

  function metropolisFlip() {
    var i = Math.floor(Math.random() * L);
    var j = Math.floor(Math.random() * L);
    var s = spins[index(i, j)];
    var nb = sumNeighbors(i, j);
    var deltaE = 2 * s * nb;
    if (deltaE <= 0 || Math.random() < Math.exp(-deltaE / T)) {
      spins[index(i, j)] = -s;
    }
  }

  function magnetization() {
    var sum = 0;
    var k;
    for (k = 0; k < L * L; k++) {
      sum += spins[k];
    }
    return sum / (L * L);
  }

  function resizeCanvas() {
    var dpr = window.devicePixelRatio || 1;
    var logical = L * CELL;
    canvas.width = Math.round(logical * dpr);
    canvas.height = Math.round(logical * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  function draw() {
    var i;
    var j;
    var s;
    for (i = 0; i < L; i++) {
      for (j = 0; j < L; j++) {
        s = spins[index(i, j)];
        ctx.fillStyle = s === 1 ? COLOR_UP : COLOR_DOWN;
        ctx.fillRect(j * CELL, i * CELL, CELL, CELL);
      }
    }
    ctx.strokeStyle = GRID;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.35;
    for (i = 0; i <= L; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, L * CELL);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL);
      ctx.lineTo(L * CELL, i * CELL);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function updateStats() {
    var m = magnetization();
    elM.textContent = m.toFixed(4);
    elAbsM.textContent = Math.abs(m).toFixed(4);
  }

  function updateTempReadout() {
    if (elTempReadout) {
      elTempReadout.textContent = ' (T = ' + T.toFixed(2) + ', T_c ≈ ' + T_CRITICAL.toFixed(3) + ')';
    }
  }

  function tick() {
    var s;
    var k;
    if (running) {
      for (s = 0; s < sweepsPerFrame; s++) {
        for (k = 0; k < L * L; k++) {
          metropolisFlip();
        }
      }
    }
    draw();
    updateStats();
    if (running) {
      rafId = window.requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }

  function startLoop() {
    if (rafId == null) {
      rafId = window.requestAnimationFrame(tick);
    }
  }

  function stopLoop() {
    if (rafId != null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function setRunning(next) {
    running = next;
    btnToggle.textContent = running ? 'PAUSE' : 'RUN';
    btnToggle.setAttribute('aria-pressed', running ? 'true' : 'false');
    if (running) {
      startLoop();
    } else {
      stopLoop();
      draw();
      updateStats();
    }
  }

  function canvasToCell(clientX, clientY) {
    var rect = canvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    var logical = L * CELL;
    var scale = logical / rect.width;
    var x = (clientX - rect.left) * scale;
    var y = (clientY - rect.top) * scale;
    var j = Math.floor(x / CELL);
    var i = Math.floor(y / CELL);
    if (i < 0 || i >= L || j < 0 || j >= L) return null;
    return { i: i, j: j };
  }

  function onCanvasClick(e) {
    var cell = canvasToCell(e.clientX, e.clientY);
    if (!cell) return;
    spins[index(cell.i, cell.j)] *= -1;
    draw();
    updateStats();
  }

  btnToggle.addEventListener('click', function() {
    setRunning(!running);
  });

  btnReset.addEventListener('click', function() {
    randomize();
    draw();
    updateStats();
  });

  inputTemp.addEventListener('input', function() {
    T = parseFloat(inputTemp.value);
    if (isNaN(T) || T < 0.1) T = 0.1;
    updateTempReadout();
  });

  canvas.addEventListener('click', onCanvasClick);

  resizeCanvas();
  randomize();
  updateTempReadout();

  running = !prefersReduced;
  btnToggle.textContent = running ? 'PAUSE' : 'RUN';
  btnToggle.setAttribute('aria-pressed', running ? 'true' : 'false');

  if (running) {
    startLoop();
  } else {
    draw();
    updateStats();
  }

  window.addEventListener('resize', function() {
    resizeCanvas();
    draw();
  });
})();
