const overlay     = document.getElementById('strangle-overlay');
const strangleCanvas = document.getElementById('strangle-canvas');
const sCtx        = strangleCanvas.getContext('2d');
const progressBar = document.getElementById('progress-bar');
const hint        = document.getElementById('strangle-hint');

let progress      = 0;      // 0–required
let required      = 100;    // total progress needed (increases with level)
let lastY         = null;
let lastDir       = null;   // 'up' | 'down'
let onComplete    = null;
let currentSnake  = null;
let animId        = null;
let killedTimer   = null;

const STROKE_VALUE = 4;  // progress per direction-change stroke
let fistPhase = 0; // animation phase for fist movement

/**
 * @param {Snake}    snake
 * @param {number}   level
 * @param {function} completeCb — called when progress reaches required
 */
export function startStrangle(snake, level, completeCb) {
  if (killedTimer !== null) { clearTimeout(killedTimer); killedTimer = null; }
  if (animId !== null) { cancelAnimationFrame(animId); animId = null; }
  removeListeners();
  currentSnake = snake;
  onComplete   = completeCb;
  progress     = 0;
  required     = 100 + level * 20;
  lastY        = null;
  lastDir      = null;
  fistPhase    = 0;

  hint.textContent = level < 3
    ? 'Двигай вверх-вниз!'
    : 'Быстрей! Быстрей!';

  overlay.classList.add('active');
  progressBar.style.width = '0%';

  drawStrangleScreen(false);
  animId = requestAnimationFrame(animateStrangle);

  overlay.addEventListener('touchmove', onTouchMove, { passive: false });
  overlay.addEventListener('pointermove', onPointerMove);
  overlay.addEventListener('pointerdown', onPointerDown);
  overlay.addEventListener('pointerup', onPointerUp);
  overlay.addEventListener('pointercancel', onPointerUp);
}

function onPointerDown(e) {
  lastY = e.clientY;
}

function onPointerUp() { lastY = null; }

function onPointerMove(e) {
  if (lastY === null) return;
  const dy = e.clientY - lastY;
  processMovement(dy, e.clientY);
}

function onTouchMove(e) {
  e.preventDefault();
  if (e.touches.length !== 1) return;
  const touch = e.touches[0];
  if (lastY === null) { lastY = touch.clientY; return; }
  const dy = touch.clientY - lastY;
  processMovement(dy, touch.clientY);
}

function processMovement(dy, newY) {
  if (Math.abs(dy) < 3) return; // deadzone

  const dir = dy > 0 ? 'down' : 'up';
  if (lastDir && dir !== lastDir) {
    // Direction change = one strangle stroke
    progress = Math.min(progress + STROKE_VALUE, required);
    progressBar.style.width = `${(progress / required) * 100}%`;

    if (progress >= required) {
      killSnake();
      return;
    }
  }
  lastDir = dir;
  lastY   = newY;
}

function killSnake() {
  currentSnake.dead = true;
  removeListeners();
  cancelAnimationFrame(animId);
  progressBar.style.width = '100%';

  drawStrangleScreen(true);

  killedTimer = setTimeout(() => {
    overlay.classList.remove('active');
    onComplete && onComplete();
  }, 1500);
}

function animateStrangle() {
  fistPhase += 0.08;
  drawStrangleScreen(false);
  animId = requestAnimationFrame(animateStrangle);
}

function drawStrangleScreen(killed) {
  const W = strangleCanvas.width;
  const H = strangleCanvas.height;
  sCtx.clearRect(0, 0, W, H);

  sCtx.fillStyle = '#111';
  sCtx.fillRect(0, 0, W, H);

  const cx = W / 2;
  const cy = H / 2 - 20;
  const snakeR = 60;

  const colors = currentSnake.def.colors;
  const grad = sCtx.createRadialGradient(cx, cy, 10, cx, cy, snakeR);
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(1, colors[colors.length - 1] || colors[0]);
  sCtx.beginPath();
  sCtx.arc(cx, cy, snakeR, 0, Math.PI * 2);
  sCtx.fillStyle = grad;
  sCtx.fill();

  if (killed) {
    drawKilledEyes(cx, cy, snakeR);
    drawDeadTongue(cx, cy, snakeR);
    drawNoSignal(cx, cy + snakeR + 40);
  } else {
    drawAliveEyes(cx, cy, snakeR);
    drawFist(cx, cy, snakeR);
  }
}

function drawFist(cx, cy, snakeR) {
  // Fist oscillates up-down along neck
  const fistY = cy - snakeR * 0.3 + Math.sin(fistPhase) * snakeR * 0.35;
  sCtx.save();
  sCtx.font = '48px serif';
  sCtx.textAlign = 'center';
  sCtx.textBaseline = 'middle';
  // Slight squeeze scale based on position (squeezes when lower)
  const squeeze = 1 + (Math.sin(fistPhase) + 1) * 0.08;
  sCtx.scale(squeeze, 1 / squeeze);
  sCtx.fillText('✊', cx / squeeze, fistY * squeeze);
  sCtx.restore();
}

function drawAliveEyes(cx, cy, r) {
  for (const side of [-1, 1]) {
    const ex = cx + side * r * 0.35;
    const ey = cy - r * 0.15;
    sCtx.beginPath();
    sCtx.arc(ex, ey, 9, 0, Math.PI * 2);
    sCtx.fillStyle = '#fff';
    sCtx.fill();
    sCtx.beginPath();
    sCtx.arc(ex + 2, ey, 5, 0, Math.PI * 2);
    sCtx.fillStyle = '#000';
    sCtx.fill();
  }
}

function drawKilledEyes(cx, cy, r) {
  sCtx.strokeStyle = '#fff';
  sCtx.lineWidth = 3;
  for (const side of [-1, 1]) {
    const ex = cx + side * r * 0.35;
    const ey = cy - r * 0.15;
    sCtx.beginPath();
    sCtx.moveTo(ex - 7, ey - 7); sCtx.lineTo(ex + 7, ey + 7);
    sCtx.moveTo(ex + 7, ey - 7); sCtx.lineTo(ex - 7, ey + 7);
    sCtx.stroke();
  }
}

function drawDeadTongue(cx, cy, r) {
  sCtx.strokeStyle = '#ff4444';
  sCtx.lineWidth = 4;
  sCtx.lineCap = 'round';
  sCtx.beginPath();
  sCtx.moveTo(cx, cy + r * 0.3);
  sCtx.lineTo(cx, cy + r + 20);
  sCtx.moveTo(cx, cy + r + 20);
  sCtx.lineTo(cx - 8, cy + r + 34);
  sCtx.moveTo(cx, cy + r + 20);
  sCtx.lineTo(cx + 8, cy + r + 34);
  sCtx.stroke();
}

function drawNoSignal(cx, y) {
  sCtx.lineCap = 'round';
  const arcs = [30, 20, 10];
  for (let i = 0; i < arcs.length; i++) {
    const rad = arcs[i];
    sCtx.beginPath();
    sCtx.arc(cx, y + 10, rad, Math.PI * 1.1, Math.PI * 1.9);
    sCtx.strokeStyle = i === 0 ? '#555' : '#aaa';
    sCtx.lineWidth = 3;
    sCtx.stroke();
  }

  sCtx.beginPath();
  sCtx.arc(cx, y + 10, 3, 0, Math.PI * 2);
  sCtx.fillStyle = '#aaa';
  sCtx.fill();

  sCtx.font = '22px serif';
  sCtx.textAlign = 'center';
  sCtx.fillStyle = '#F5A623';
  sCtx.fillText('⚠️', cx + 18, y - 10);

  sCtx.font = '13px Arial';
  sCtx.fillStyle = '#999';
  sCtx.textAlign = 'center';
  sCtx.fillText('Проблемы со связью.', cx, y + 44);
  sCtx.fillText('Проверьте настройки интернета и VPN', cx, y + 60);
}

function removeListeners() {
  overlay.removeEventListener('touchmove', onTouchMove);
  overlay.removeEventListener('pointermove', onPointerMove);
  overlay.removeEventListener('pointerdown', onPointerDown);
  overlay.removeEventListener('pointerup', onPointerUp);
  overlay.removeEventListener('pointercancel', onPointerUp);
}
