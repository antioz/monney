import { Snake, SNAKE_DEFS } from './snakes.js';
import { startStrangle } from './strangle.js';
import { showDeathScreen } from './share.js';

const canvas   = document.getElementById('field');
const ctx      = canvas.getContext('2d');
const levelEl  = document.getElementById('level-display');
const scoreEl  = document.getElementById('score-display');

let snakes = [];
let score  = 0;
let level  = 1;
let paused = false;
let animId = null;

// Level config
function levelConfig(lvl) {
  return {
    speed:        1.2 + lvl * 0.3,
    spawnInterval: Math.max(4000 - lvl * 300, 1500),
    maxSnakes:    3 + Math.floor(lvl / 2),
  };
}

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

function spawnSnake() {
  const cfg   = levelConfig(level);
  if (snakes.length >= cfg.maxSnakes) return;

  const onField = new Set(snakes.map(s => s.def.id));
  const pool    = SNAKE_DEFS.filter(d => !onField.has(d.id));
  if (!pool.length) return;

  const def = pool[Math.floor(Math.random() * pool.length)];
  snakes.push(new Snake(def, cfg.speed, canvas.width, canvas.height));
}

function gameLoop(t) {
  if (paused) return;
  animId = requestAnimationFrame(gameLoop);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const snake of snakes) {
    snake.update(t);
    snake.draw(ctx);
  }
}

function handleTap(x, y) {
  if (paused) return;

  for (const snake of snakes) {
    if (snake.hitTest(x, y)) {
      if (snake.def.type === 'good') {
        triggerGameOver();
      } else {
        triggerStrangle(snake);
      }
      return;
    }
  }
}

function triggerStrangle(snake) {
  paused = true;
  cancelAnimationFrame(animId);

  startStrangle(snake, level, () => {
    score += 10 * level;
    level++;
    snakes = snakes.filter(s => s !== snake);
    scoreEl.textContent = score;
    levelEl.textContent = `Уровень ${level}`;
    paused = false;
    animId = requestAnimationFrame(gameLoop);
    resetSpawnTimer();
  });
}

function triggerGameOver() {
  paused = true;
  cancelAnimationFrame(animId);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  showDeathScreen(score, level);
}

// Input — prevent double-fire of click after touchstart on mobile
let tapped = false;
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  tapped = true;
  const t = e.changedTouches[0];
  handleTap(t.clientX, t.clientY);
}, { passive: false });
canvas.addEventListener('click', e => {
  if (tapped) { tapped = false; return; }
  handleTap(e.clientX, e.clientY);
});

// Spawn timer
let spawnTimer;
function resetSpawnTimer() {
  clearInterval(spawnTimer);
  const cfg = levelConfig(level);
  spawnTimer = setInterval(() => {
    if (!paused) spawnSnake();
  }, cfg.spawnInterval);
}

// Init
window.addEventListener('resize', resize);
resize();
spawnSnake();
spawnSnake();
resetSpawnTimer();
animId = requestAnimationFrame(gameLoop);
