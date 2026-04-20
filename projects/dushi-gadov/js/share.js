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
