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

  /** Hit-test: did the tap/click land on this snake's head area? */
  hitTest(x, y) {
    if (this.dead) return false;
    const head = this.history[0];
    return Math.hypot(x - head.x, y - head.y) < SEG_RADIUS * 2.5;
  }

  get headPos() {
    return this.history[0] || { x: this.headX, y: this.headY };
  }
}
