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
    type: 'bad',
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
const HISTORY_SIZE = Math.round(SEG_COUNT * SEG_GAP);

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

    // Start position — random edge
    const edge = Math.floor(Math.random() * 4);
    let sx, sy, angle;
    if (edge === 0) { sx = Math.random() * fieldW; sy = -50; angle = Math.PI / 2; }
    else if (edge === 1) { sx = fieldW + 50; sy = Math.random() * fieldH; angle = Math.PI; }
    else if (edge === 2) { sx = Math.random() * fieldW; sy = fieldH + 50; angle = -Math.PI / 2; }
    else { sx = -50; sy = Math.random() * fieldH; angle = 0; }

    // History of head positions for segment chaining
    this.history = [];
    for (let i = 0; i < HISTORY_SIZE; i++) {
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
    if (this.history.length > HISTORY_SIZE) this.history.pop();

    return false;
  }

  /** Draw onto canvas context */
  draw(ctx) {
    ctx.save();
    const { colors } = this.def;

    if (this.history.length < 2) { ctx.restore(); return; }

    // Build smooth path through history points (use every 3rd for perf)
    const pts = [];
    for (let i = 0; i < HISTORY_SIZE; i += 3) {
      pts.push(this.history[i] || this.history[this.history.length - 1]);
    }
    if (pts.length < 2) { ctx.restore(); return; }

    // Draw body as thick tapered stroke
    // Draw in segments so we can taper width and change color
    const segCount = pts.length - 1;
    for (let i = 0; i < segCount; i++) {
      const t = i / segCount; // 0 = head, 1 = tail
      const p0 = pts[i];
      const p1 = pts[i + 1];

      const colorIdx = Math.floor(t * colors.length) % colors.length;
      const color = colors[colorIdx];
      const lineW = SEG_RADIUS * 2 * (1 - t * 0.55); // taper toward tail

      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineW;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    // Head — filled circle with eyes
    const head = pts[0];
    const headR = SEG_RADIUS;
    ctx.beginPath();
    ctx.arc(head.x, head.y, headR, 0, Math.PI * 2);
    ctx.fillStyle = colors[0];
    ctx.fill();

    this._drawEyes(ctx, head, this.angle, headR, this.dead);

    // Label near neck (3rd point)
    const labelPos = pts[Math.min(3, pts.length - 1)];
    ctx.font = `bold ${SEG_RADIUS * 0.85}px Arial`;
    ctx.fillStyle = colors.length > 1 ? colors[1] : '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.def.label, labelPos.x, labelPos.y);

    // Good snake halo
    if (this.def.type === 'good') {
      ctx.beginPath();
      ctx.arc(head.x, head.y, headR + 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
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

  /** Hit-test: did the tap/click land on this snake's body? */
  hitTest(x, y) {
    if (this.dead) return false;
    // Check every 3rd history point (matches draw sampling)
    for (let i = 0; i < HISTORY_SIZE; i += 3) {
      const p = this.history[i];
      if (!p) continue;
      const r = SEG_RADIUS * (1 - (i / HISTORY_SIZE) * 0.55) + 6; // tolerance
      if (Math.hypot(x - p.x, y - p.y) < r) return true;
    }
    return false;
  }

  get headPos() {
    return this.history[0] || { x: this.headX, y: this.headY };
  }
}
