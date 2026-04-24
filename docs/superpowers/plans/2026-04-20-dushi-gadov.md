# ДУШИ ГАДОВ — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-adaptive browser arcade game where players strangle bad snakes (blocked services) while avoiding good snakes (Russian services).

**Architecture:** Static HTML/CSS/JS, no build step. One canvas per snake rendered as DOM elements on a shared game field. Game state lives in memory (single session). Three screens: main → game field → game over.

**Tech Stack:** Vanilla JS (ES modules), HTML5 Canvas (for snakes + share image), CSS custom properties, Web Share API, pointer/touch events.

---

## File Map

| File | Responsibility |
|------|---------------|
| `projects/dushi-gadov/index.html` | Main screen — title + "Начать" button |
| `projects/dushi-gadov/game.html` | Game field screen |
| `projects/dushi-gadov/gameover.html` | Game over screen + share |
| `projects/dushi-gadov/styles.css` | All styles, CSS vars for snake colors |
| `projects/dushi-gadov/js/snakes.js` | Snake definitions (colors, type), Snake class (movement, drawing) |
| `projects/dushi-gadov/js/game.js` | Game loop, spawning, collision detection, score, level |
| `projects/dushi-gadov/js/strangle.js` | Strangle minigame — pointer/touch input → progress bar |
| `projects/dushi-gadov/js/share.js` | Canvas share image generation + Web Share API |

---

## Task 0: Реорганизация репозитория

**Files:**
- Move: `index.html` → `projects/poproshaika/index.html`
- Move: `money.html` → `projects/poproshaika/money.html`
- Move: `startup.html` → `projects/poproshaika/startup.html`
- Move: `og-image.png` → `projects/poproshaika/og-image.png`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Создать папку и переместить файлы**

```bash
mkdir -p projects/poproshaika
git mv index.html projects/poproshaika/index.html
git mv money.html projects/poproshaika/money.html
git mv startup.html projects/poproshaika/startup.html
git mv og-image.png projects/poproshaika/og-image.png
```

- [ ] **Step 2: Обновить CLAUDE.md — добавить описание структуры**

Добавить в `CLAUDE.md` после секции "Архитектура":

```markdown
## Структура репозитория

```
projects/
├── poproshaika/     — лендинг/монетизация (index.html, money.html, startup.html)
├── chrono-soul-backend/ — backend Telegram Mini App
└── dushi-gadov/     — веб-игра "ДУШИ ГАДОВ"
```
```

- [ ] **Step 3: Коммит**

```bash
git add -A
git commit -m "refactor: reorganize projects into subfolders"
```

---

## Task 1: Структура проекта и главный экран

**Files:**
- Create: `projects/dushi-gadov/index.html`
- Create: `projects/dushi-gadov/styles.css`

- [ ] **Step 1: Создать папку**

```bash
mkdir -p projects/dushi-gadov/js projects/dushi-gadov/assets
```

- [ ] **Step 2: Создать `projects/dushi-gadov/styles.css`**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #0d0d0d;
  --text: #f0f0f0;
  --accent: #ff3b3b;
  --btn-bg: #ff3b3b;
  --btn-text: #fff;
  --bar-fill: #ff3b3b;
  --bar-bg: #333;

  /* Snake colors */
  --telegram: #2AABEE;
  --instagram-1: #833AB4;
  --instagram-2: #E1306C;
  --instagram-3: #F77737;
  --whatsapp: #25D366;
  --vpn: #00FF41;
  --vpn-bg: #1a1a2e;
  --pornhub: #FF9000;
  --pornhub-bg: #1a1a1a;

  --vk: #0077FF;
  --tbank: #FFDD2D;
  --tbank-bg: #1a1a1a;
  --sber: #21A038;
  --yataxi: #FC3F1D;
  --yataxi-bg: #1a1a1a;
  --max-1: #4B6EF5;
  --max-2: #8B5CF6;
}

html, body {
  height: 100%;
  background: var(--bg);
  color: var(--text);
  font-family: 'Arial', sans-serif;
  overflow: hidden;
  touch-action: none;
}

.screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100dvh;
  padding: 24px;
  text-align: center;
}

.title {
  font-size: clamp(2rem, 8vw, 4rem);
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 16px;
}

.subtitle {
  font-size: clamp(0.9rem, 3vw, 1.2rem);
  opacity: 0.6;
  margin-bottom: 48px;
}

.btn {
  background: var(--btn-bg);
  color: var(--btn-text);
  border: none;
  border-radius: 12px;
  padding: 18px 48px;
  font-size: clamp(1.1rem, 4vw, 1.4rem);
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: transform 0.1s, opacity 0.1s;
  -webkit-tap-highlight-color: transparent;
}

.btn:active { transform: scale(0.96); opacity: 0.85; }

.score-display {
  position: absolute;
  top: 16px;
  right: 20px;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--accent);
}

.level-display {
  position: absolute;
  top: 16px;
  left: 20px;
  font-size: 1rem;
  opacity: 0.6;
}

/* Strangle overlay */
#strangle-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.92);
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  touch-action: none;
}

#strangle-overlay.active { display: flex; }

#strangle-canvas {
  width: min(80vw, 320px);
  height: min(80vw, 320px);
}

.progress-wrap {
  width: min(80vw, 320px);
  height: 24px;
  background: var(--bar-bg);
  border-radius: 12px;
  margin-top: 24px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  width: 0%;
  background: var(--bar-fill);
  border-radius: 12px;
  transition: width 0.05s linear;
}

.strangle-hint {
  margin-top: 16px;
  font-size: 0.9rem;
  opacity: 0.5;
}

/* Death screen */
#death-screen {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.85);
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 24px;
  text-align: center;
}

#death-screen.active { display: flex; }

#death-canvas {
  border-radius: 16px;
  width: min(80vw, 360px);
  height: min(80vw, 360px);
  margin: 24px 0;
}

.death-score {
  font-size: clamp(1.4rem, 5vw, 2rem);
  font-weight: 900;
  color: var(--accent);
}

.death-label {
  font-size: 0.9rem;
  opacity: 0.5;
  margin-bottom: 8px;
}

.btn-row {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-secondary {
  background: #222;
  color: var(--text);
}

/* Kill animation */
@keyframes tongue-out {
  0%   { transform: scaleY(1); }
  50%  { transform: scaleY(1.05) rotate(-2deg); }
  100% { transform: scaleY(1); }
}

.killed { animation: tongue-out 0.4s ease; }
```

- [ ] **Step 3: Создать `projects/dushi-gadov/index.html`**

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#0d0d0d">
  <title>ДУШИ ГАДОВ</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="screen">
    <h1 class="title">ДУШИ ГАДОВ</h1>
    <p class="subtitle">Задуши всех гадов. Не тронь хороших.</p>
    <a href="game.html" class="btn">НАЧАТЬ</a>
  </div>
</body>
</html>
```

- [ ] **Step 4: Проверить в браузере**

```bash
cd projects/dushi-gadov && python3 -m http.server 8080
```

Открыть http://localhost:8080 — должен быть тёмный экран с заголовком и кнопкой "НАЧАТЬ".

- [ ] **Step 5: Коммит**

```bash
git add projects/dushi-gadov/
git commit -m "feat: add dushi-gadov project structure and main screen"
```

---

## Task 2: Данные и класс змеи (`snakes.js`)

**Files:**
- Create: `projects/dushi-gadov/js/snakes.js`

Змея — последовательность сегментов. Голова движется по синусоидальной траектории, каждый следующий сегмент запоминает предыдущие позиции головы (chain follower pattern).

- [ ] **Step 1: Создать `projects/dushi-gadov/js/snakes.js`**

```js
export const SNAKE_DEFS = [
  // --- BAD (душить) ---
  {
    id: 'telegram',
    type: 'bad',
    colors: ['#2AABEE', '#ffffff'],
    label: 'TG',
  },
  {
    id: 'instagram',
    type: 'bad',
    colors: ['#833AB4', '#E1306C', '#F77737'],
    label: 'IG',
  },
  {
    id: 'whatsapp',
    type: 'bad',
    colors: ['#25D366', '#128C7E'],
    label: 'WA',
  },
  {
    id: 'vpn',
    type: 'bad',
    colors: ['#00FF41', '#1a1a2e'],
    label: 'VPN',
  },
  {
    id: 'pornhub',
    type: 'bad',
    colors: ['#FF9000', '#1a1a1a'],
    label: 'PH',
  },
  // --- GOOD (не трогать) ---
  {
    id: 'vk',
    type: 'good',
    colors: ['#0077FF', '#ffffff'],
    label: 'VK',
  },
  {
    id: 'tbank',
    type: 'good',
    colors: ['#FFDD2D', '#1a1a1a'],
    label: 'TB',
  },
  {
    id: 'sber',
    type: 'good',
    colors: ['#21A038', '#ffffff'],
    label: 'SB',
  },
  {
    id: 'yataxi',
    type: 'good',
    colors: ['#FC3F1D', '#1a1a1a'],
    label: 'YT',
  },
  {
    id: 'max',
    type: 'good',
    colors: ['#4B6EF5', '#8B5CF6'],
    label: 'MAX',
  },
];

const SEG_RADIUS = 14;  // px, radius of each segment
const SEG_GAP    = SEG_RADIUS * 1.8;
const SEG_COUNT  = 10;

export class Snake {
  /**
   * @param {object} def  - one entry from SNAKE_DEFS
   * @param {number} speed - pixels per frame
   * @param {number} fieldW
   * @param {number} fieldH
   */
  constructor(def, speed, fieldW, fieldH) {
    this.def    = def;
    this.speed  = speed;
    this.fieldW = fieldW;
    this.fieldH = fieldH;
    this.dead   = false;
    this.clicked = false;

    // Start position — random edge
    const edge = Math.floor(Math.random() * 4);
    let sx, sy, angle;
    if (edge === 0) { sx = Math.random() * fieldW; sy = -50; angle = Math.PI / 2; }
    else if (edge === 1) { sx = fieldW + 50; sy = Math.random() * fieldH; angle = Math.PI; }
    else if (edge === 2) { sx = Math.random() * fieldW; sy = fieldH + 50; angle = -Math.PI / 2; }
    else { sx = -50; sy = Math.random() * fieldH; angle = 0; }

    // History of head positions for segment chaining
    this.history = [];
    for (let i = 0; i < SEG_COUNT * SEG_GAP; i++) {
      this.history.push({ x: sx, y: sy });
    }

    this.headX  = sx;
    this.headY  = sy;
    this.angle  = angle;          // current direction
    this.wiggle = Math.random() * Math.PI * 2; // phase offset
    this.wiggleSpeed = 0.04 + Math.random() * 0.02;
    this.turnRate = 0.03 + Math.random() * 0.02;
  }

  /** Call once per frame. Returns true if snake has left the field. */
  update(t) {
    // Gently steer toward center to keep snakes on screen
    const cx = this.fieldW / 2;
    const cy = this.fieldH / 2;
    const dx = cx - this.headX;
    const dy = cy - this.headY;
    const distToCenter = Math.hypot(dx, dy);
    const maxDist = Math.hypot(cx, cy) * 0.7;

    let targetAngle = this.angle;
    if (distToCenter > maxDist) {
      targetAngle = Math.atan2(dy, dx);
    } else {
      // Sine wave wiggle
      this.wiggle += this.wiggleSpeed;
      targetAngle += Math.sin(this.wiggle) * 0.08;
    }

    // Smoothly rotate toward target
    let da = targetAngle - this.angle;
    // Normalize to [-π, π]
    while (da > Math.PI)  da -= 2 * Math.PI;
    while (da < -Math.PI) da += 2 * Math.PI;
    this.angle += da * this.turnRate;

    this.headX += Math.cos(this.angle) * this.speed;
    this.headY += Math.sin(this.angle) * this.speed;

    // Push to history
    this.history.unshift({ x: this.headX, y: this.headY });
    if (this.history.length > SEG_COUNT * SEG_GAP * 2) {
      this.history.length = SEG_COUNT * SEG_GAP;
    }

    return false;
  }

  /** Draw onto canvas context */
  draw(ctx) {
    const { colors } = this.def;

    for (let i = SEG_COUNT - 1; i >= 0; i--) {
      const pos = this.history[Math.floor(i * SEG_GAP)] || this.history[this.history.length - 1];
      const t = i / SEG_COUNT;

      // Color — cycle through def.colors along body
      const colorIdx = Math.floor(t * colors.length) % colors.length;
      const color = colors[colorIdx];

      // Taper body toward tail
      const r = SEG_RADIUS * (1 - t * 0.5);

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Eyes on head segment
      if (i === 0) {
        this._drawEyes(ctx, pos, this.angle, r, this.dead);
      }
    }

    // Label on body center segment
    const labelPos = this.history[Math.floor(3 * SEG_GAP)] || this.history[0];
    ctx.font = `bold ${SEG_RADIUS * 0.9}px Arial`;
    ctx.fillStyle = colors.length > 1 ? colors[1] : '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.def.label, labelPos.x, labelPos.y);

    // Good snake indicator — small ✓ halo
    if (this.def.type === 'good') {
      const head = this.history[0];
      ctx.beginPath();
      ctx.arc(head.x, head.y, SEG_RADIUS + 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  _drawEyes(ctx, pos, angle, r, dead) {
    const eyeOffset = r * 0.5;
    const perpX = -Math.sin(angle);
    const perpY =  Math.cos(angle);
    const fwdX  =  Math.cos(angle) * r * 0.3;
    const fwdY  =  Math.sin(angle) * r * 0.3;

    for (const side of [-1, 1]) {
      const ex = pos.x + fwdX + perpX * side * eyeOffset;
      const ey = pos.y + fwdY + perpY * side * eyeOffset;

      ctx.beginPath();
      ctx.arc(ex, ey, r * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();

      if (dead) {
        // × eyes
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ex - 3, ey - 3); ctx.lineTo(ex + 3, ey + 3);
        ctx.moveTo(ex + 3, ey - 3); ctx.lineTo(ex - 3, ey + 3);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(ex + Math.cos(angle) * 1.5, ey + Math.sin(angle) * 1.5, r * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
      }
    }

    // Tongue (only alive snakes, bad type)
    if (!dead && this.def.type === 'bad') {
      const tx = pos.x + Math.cos(angle) * (r + 8);
      const ty = pos.y + Math.sin(angle) * (r + 8);
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pos.x + Math.cos(angle) * r, pos.y + Math.sin(angle) * r);
      ctx.lineTo(tx, ty);
      // Fork
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + Math.cos(angle + 0.4) * 5, ty + Math.sin(angle + 0.4) * 5);
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + Math.cos(angle - 0.4) * 5, ty + Math.sin(angle - 0.4) * 5);
      ctx.stroke();
    }
  }

  /** Hit-test: did the tap/click land on this snake's head area? */
  hitTest(x, y) {
    const head = this.history[0];
    return Math.hypot(x - head.x, y - head.y) < SEG_RADIUS * 2.5;
  }

  get headPos() {
    return this.history[0] || { x: this.headX, y: this.headY };
  }
}
```

- [ ] **Step 2: Коммит**

```bash
git add projects/dushi-gadov/js/snakes.js
git commit -m "feat: add snake definitions and Snake class"
```

---

## Task 3: Игровое поле и игровой цикл (`game.html` + `game.js`)

**Files:**
- Create: `projects/dushi-gadov/game.html`
- Create: `projects/dushi-gadov/js/game.js`

- [ ] **Step 1: Создать `projects/dushi-gadov/game.html`**

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#0d0d0d">
  <title>ДУШИ ГАДОВ</title>
  <link rel="stylesheet" href="styles.css">
  <style>
    #field {
      position: fixed;
      inset: 0;
      background: var(--bg);
      touch-action: none;
    }
  </style>
</head>
<body>
  <canvas id="field"></canvas>

  <div class="level-display" id="level-display">Уровень 1</div>
  <div class="score-display" id="score-display">0</div>

  <!-- Strangle overlay -->
  <div id="strangle-overlay">
    <canvas id="strangle-canvas" width="320" height="320"></canvas>
    <div class="progress-wrap">
      <div class="progress-bar" id="progress-bar"></div>
    </div>
    <p class="strangle-hint" id="strangle-hint">Двигай вверх-вниз чтобы задушить!</p>
  </div>

  <!-- Death screen -->
  <div id="death-screen">
    <p class="death-label">Ты схватил не того!</p>
    <p class="death-score" id="death-score">0 очков</p>
    <canvas id="death-canvas" width="360" height="360"></canvas>
    <div class="btn-row">
      <button class="btn" id="share-btn">Поделиться</button>
      <a href="index.html" class="btn btn-secondary">В начало</a>
    </div>
  </div>

  <script type="module" src="js/game.js"></script>
</body>
</html>
```

- [ ] **Step 2: Создать `projects/dushi-gadov/js/game.js`**

```js
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
    speed:        1.2 + lvl * 0.3,       // px/frame head movement
    spawnInterval: Math.max(4000 - lvl * 300, 1500), // ms between spawns
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

  // Pick random def not already on field
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

  const cfg = levelConfig(level);
  startStrangle(snake, level, () => {
    // Success callback
    score += 10 * level;
    level++;
    snakes = snakes.filter(s => s !== snake);
    scoreEl.textContent = score;
    levelEl.textContent = `Уровень ${level}`;
    paused = false;
    animId = requestAnimationFrame(gameLoop);
  });
}

function triggerGameOver() {
  paused = true;
  cancelAnimationFrame(animId);
  showDeathScreen(score, level);
}

// Input
canvas.addEventListener('click', e => {
  handleTap(e.clientX, e.clientY);
});
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const t = e.changedTouches[0];
  handleTap(t.clientX, t.clientY);
}, { passive: false });

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
```

- [ ] **Step 3: Проверить в браузере**

```bash
cd projects/dushi-gadov && python3 -m http.server 8080
```

Открыть http://localhost:8080/game.html — должны появиться 2 змеи, ползающие по тёмному полю. Console не должен содержать ошибок.

- [ ] **Step 4: Коммит**

```bash
git add projects/dushi-gadov/game.html projects/dushi-gadov/js/game.js
git commit -m "feat: add game field, game loop, and spawn logic"
```

---

## Task 4: Минигейм душения (`strangle.js`)

**Files:**
- Create: `projects/dushi-gadov/js/strangle.js`

- [ ] **Step 1: Создать `projects/dushi-gadov/js/strangle.js`**

```js
const overlay     = document.getElementById('strangle-overlay');
const strangleCanvas = document.getElementById('strangle-canvas');
const sCtx        = strangleCanvas.getContext('2d');
const progressBar = document.getElementById('progress-bar');
const hint        = document.getElementById('strangle-hint');

let progress      = 0;      // 0–100
let required      = 100;    // total progress needed (increases with level)
let lastY         = null;
let lastDir       = null;   // 'up' | 'down'
let onComplete    = null;
let currentSnake  = null;
let animId        = null;
let killedTimer   = null;

const STROKE_VALUE = 4;  // progress per direction-change stroke

/**
 * @param {Snake}    snake
 * @param {number}   level
 * @param {function} completeCb — called when progress reaches 100
 */
export function startStrangle(snake, level, completeCb) {
  currentSnake = snake;
  onComplete   = completeCb;
  progress     = 0;
  required     = 100 + level * 20;   // harder each level
  lastY        = null;
  lastDir      = null;

  hint.textContent = level < 3
    ? 'Двигай вверх-вниз!'
    : 'Быстрей! Быстрей!';

  overlay.classList.add('active');
  progressBar.style.width = '0%';

  drawStrangleScreen(false);
  animId = requestAnimationFrame(animateStrangle);

  // Touch: one finger on mobile
  overlay.addEventListener('touchmove', onTouchMove, { passive: false });
  // Pointer: two-finger touchpad or mouse drag
  overlay.addEventListener('pointermove', onPointerMove);
  overlay.addEventListener('pointerdown', onPointerDown);
}

function onPointerDown(e) {
  lastY = e.clientY;
}

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

  // Show death animation then "no signal" screen
  drawStrangleScreen(true);

  killedTimer = setTimeout(() => {
    overlay.classList.remove('active');
    onComplete && onComplete();
  }, 1500);
}

function animateStrangle() {
  drawStrangleScreen(false);
  animId = requestAnimationFrame(animateStrangle);
}

function drawStrangleScreen(killed) {
  const W = strangleCanvas.width;
  const H = strangleCanvas.height;
  sCtx.clearRect(0, 0, W, H);

  // Background
  sCtx.fillStyle = '#111';
  sCtx.fillRect(0, 0, W, H);

  const cx = W / 2;
  const cy = H / 2 - 20;
  const snakeR = 60;

  // Draw snake body (simplified — large circle with colors)
  const colors = currentSnake.def.colors;
  const grad = sCtx.createRadialGradient(cx, cy, 10, cx, cy, snakeR);
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(1, colors[colors.length - 1] || colors[0]);
  sCtx.beginPath();
  sCtx.arc(cx, cy, snakeR, 0, Math.PI * 2);
  sCtx.fillStyle = grad;
  sCtx.fill();

  if (killed) {
    // × eyes
    drawKilledEyes(cx, cy, snakeR);
    // Tongue hanging down
    drawDeadTongue(cx, cy, snakeR);
    // "No signal" icon below
    drawNoSignal(cx, cy + snakeR + 40);
  } else {
    // Alive eyes
    drawAliveEyes(cx, cy, snakeR);
    // Fist on top (squeezing)
    drawFist(cx, cy - snakeR);
  }
}

function drawFist(x, y) {
  sCtx.font = '52px serif';
  sCtx.textAlign = 'center';
  sCtx.textBaseline = 'bottom';
  sCtx.fillText('✊', x, y + 8);
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
  // Fork
  sCtx.moveTo(cx, cy + r + 20);
  sCtx.lineTo(cx - 8, cy + r + 34);
  sCtx.moveTo(cx, cy + r + 20);
  sCtx.lineTo(cx + 8, cy + r + 34);
  sCtx.stroke();
}

function drawNoSignal(cx, y) {
  // WiFi arcs with ! — drawn in canvas
  sCtx.strokeStyle = '#aaa';
  sCtx.lineWidth = 3;
  sCtx.lineCap = 'round';

  const arcs = [30, 20, 10];
  for (let i = 0; i < arcs.length; i++) {
    const rad = arcs[i];
    sCtx.beginPath();
    sCtx.arc(cx, y + 10, rad, Math.PI * 1.1, Math.PI * 1.9);
    sCtx.strokeStyle = i === 0 ? '#555' : '#aaa'; // outermost dimmed
    sCtx.stroke();
  }

  // Dot
  sCtx.beginPath();
  sCtx.arc(cx, y + 10, 3, 0, Math.PI * 2);
  sCtx.fillStyle = '#aaa';
  sCtx.fill();

  // Warning triangle
  sCtx.font = '22px serif';
  sCtx.textAlign = 'center';
  sCtx.fillStyle = '#F5A623';
  sCtx.fillText('⚠️', cx + 18, y - 10);

  // Text
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
}
```

- [ ] **Step 2: Проверить минигейм**

Открыть http://localhost:8080/game.html, кликнуть на плохую змею (TG/IG/WA/VPN/PH). Должен появиться оверлей с большой змеёй и кулаком. Двигая мышью вверх-вниз (или свайпая) прогресс-бар должен расти. После заполнения — анимация смерти + иконка "нет связи" → оверлей закрывается.

- [ ] **Step 3: Коммит**

```bash
git add projects/dushi-gadov/js/strangle.js
git commit -m "feat: add strangle minigame with pointer/touch controls"
```

---

## Task 5: Экран смерти и шер (`share.js` + `gameover.html`)

**Files:**
- Create: `projects/dushi-gadov/js/share.js`

- [ ] **Step 1: Создать `projects/dushi-gadov/js/share.js`**

```js
const deathScreen  = document.getElementById('death-screen');
const deathScoreEl = document.getElementById('death-score');
const deathCanvas  = document.getElementById('death-canvas');
const shareBtn     = document.getElementById('share-btn');
const dCtx         = deathCanvas.getContext('2d');

let _score = 0;

export function showDeathScreen(score, level) {
  _score = score;
  deathScoreEl.textContent = `${score} очков`;
  deathScreen.classList.add('active');
  drawShareImage(score, level);
  shareBtn.onclick = doShare;
}

function drawShareImage(score, level) {
  const W = deathCanvas.width;
  const H = deathCanvas.height;
  dCtx.clearRect(0, 0, W, H);

  // Background gradient
  const bg = dCtx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1a0a0a');
  bg.addColorStop(1, '#0d0d0d');
  dCtx.fillStyle = bg;
  dCtx.fillRect(0, 0, W, H);

  // Title
  dCtx.font = 'bold 28px Arial';
  dCtx.fillStyle = '#ff3b3b';
  dCtx.textAlign = 'center';
  dCtx.fillText('ДУШИ ГАДОВ', W / 2, 44);

  // Score
  dCtx.font = `bold ${score > 999 ? 52 : 64}px Arial`;
  dCtx.fillStyle = '#ffffff';
  dCtx.fillText(score, W / 2, H / 2 - 20);

  dCtx.font = '18px Arial';
  dCtx.fillStyle = '#888';
  dCtx.fillText('очков', W / 2, H / 2 + 14);

  // Draw bag of snakes (decorative)
  drawSnakeBag(dCtx, W / 2, H * 0.78, 60);

  // Level
  dCtx.font = '14px Arial';
  dCtx.fillStyle = '#555';
  dCtx.fillText(`Уровень ${level}`, W / 2, H - 20);
}

function drawSnakeBag(ctx, cx, cy, r) {
  // Bag shape
  ctx.beginPath();
  ctx.ellipse(cx, cy + 10, r * 0.7, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#2a1a0a';
  ctx.fill();
  ctx.strokeStyle = '#5a3a1a';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Bag top knot
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy - r * 0.35);
  ctx.quadraticCurveTo(cx, cy - r * 0.6, cx + 14, cy - r * 0.35);
  ctx.strokeStyle = '#5a3a1a';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Snakes poking out — coloured squiggles
  const snakeColors = ['#2AABEE', '#833AB4', '#25D366', '#FF9000', '#0077FF'];
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI - Math.PI / 2 + 0.3;
    const sx = cx + Math.cos(angle) * r * 0.4;
    const sy = cy - r * 0.3 + Math.sin(angle) * 10;

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.bezierCurveTo(
      sx + Math.cos(angle + 0.5) * 20, sy - 20,
      sx + Math.cos(angle + 1) * 30, sy - 35,
      sx + Math.cos(angle + 1.5) * 22, sy - 50
    );
    ctx.strokeStyle = snakeColors[i];
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Head dot
    ctx.beginPath();
    ctx.arc(sx + Math.cos(angle + 1.5) * 22, sy - 50, 5, 0, Math.PI * 2);
    ctx.fillStyle = snakeColors[i];
    ctx.fill();
  }
}

async function doShare() {
  deathCanvas.toBlob(async (blob) => {
    const file = new File([blob], 'dushi-gadov.png', { type: 'image/png' });
    const text = `Я задушил гадов на ${_score} очков в игре ДУШИ ГАДОВ!`;

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text });
        return;
      } catch (e) {
        if (e.name !== 'AbortError') console.warn('Share failed', e);
      }
    }

    // Fallback: download
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'dushi-gadov.png';
    a.click();
  });
}
```

- [ ] **Step 2: Проверить экран смерти**

В браузере кликнуть на хорошую змею (VK/TB/SB/YT/MAX) → должен появиться тёмный экран с очками, canvas-картинкой (мешок со змеями) и кнопкой "Поделиться". Кнопка "Поделиться" — скачать PNG или открыть Web Share API на мобиле.

- [ ] **Step 3: Коммит**

```bash
git add projects/dushi-gadov/js/share.js
git commit -m "feat: add game over screen and canvas share image"
```

---

## Task 6: Полировка и адаптив

**Files:**
- Modify: `projects/dushi-gadov/styles.css`
- Modify: `projects/dushi-gadov/game.html`

- [ ] **Step 1: Добавить meta для мобиля и PWA-цвет в game.html**

Убедиться что в `<head>` есть:
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

- [ ] **Step 2: Добавить предотвращение зума на iOS в styles.css**

```css
/* Prevent double-tap zoom on iOS */
* { touch-action: manipulation; }
#field { touch-action: none; }
#strangle-overlay { touch-action: none; }
```

- [ ] **Step 3: Проверить на мобиле**

Открыть на телефоне через локальную сеть:
```bash
# Узнать IP
ifconfig | grep "inet " | grep -v 127
# Открыть на телефоне: http://<IP>:8080
```

Проверить:
- Змеи видны, поле занимает весь экран
- Тап по плохой → минигейм открывается
- Один палец двигает прогресс-бар
- Хорошая → экран смерти
- Кнопка "Поделиться" работает через Web Share API

- [ ] **Step 4: Коммит**

```bash
git add projects/dushi-gadov/
git commit -m "feat: mobile polish and iOS touch handling"
```

---

## Task 7: Публикация на GitHub Pages

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Запушить всё**

```bash
git push origin main
```

- [ ] **Step 2: Включить GitHub Pages**

В браузере:
1. Открыть репо на GitHub → Settings → Pages
2. Source: `Deploy from a branch`
3. Branch: `main`, папка: `/ (root)`
4. Сохранить

- [ ] **Step 3: Дождаться деплоя**

Через 1-2 минуты игра будет доступна по адресу:
`https://<username>.github.io/<repo>/projects/dushi-gadov/`

Проверить что главный экран открывается и игра работает.

- [ ] **Step 4: Добавить URL в CLAUDE.md**

```markdown
## URLs проектов

- ДУШИ ГАДОВ: https://<username>.github.io/<repo>/projects/dushi-gadov/
```

- [ ] **Step 5: Коммит и пуш**

```bash
git add CLAUDE.md
git commit -m "docs: add project URLs to CLAUDE.md"
git push origin main
```

---

## Верификация (полная)

1. Главный экран — заголовок, кнопка "Начать"
2. Поле — 2+ змей ползают, новые появляются
3. Тап на плохую → оверлей с минигеймом
4. Движение вверх-вниз → прогресс-бар растёт
5. Бар заполнен → смерть змеи, иконка "нет связи", возврат на поле
6. Тап на хорошую → экран смерти со счётом
7. "Поделиться" → Web Share API (мобиль) или скачать PNG
8. На мобиле: один палец в минигейме работает
9. Уровень и счёт растут правильно
10. `projects/poproshaika/` содержит старые файлы
