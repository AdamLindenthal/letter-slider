import { ctx, W, H } from '../canvas.js';

/** ctx.roundRect polyfill for browsers < Chrome 99 / Firefox 112 */
function roundRect(x, y, w, h, r) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.arcTo(x + w, y, x + w, y + rr, rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
    ctx.lineTo(x + rr, y + h);
    ctx.arcTo(x, y + h, x, y + h - rr, rr);
    ctx.lineTo(x, y + rr);
    ctx.arcTo(x, y, x + rr, y, rr);
    ctx.closePath();
  }
}

/**
 * Tank animation:
 *   0–1600ms  Tank rolls in from right
 *   1600–2800ms Tank stops, turret aims at word labels
 *   2800ms     Fire flash, shell launches
 *   3300ms     Shell hits labels → .exploding class added
 *   3500–5000ms Tank drives off to the left
 */
export function tankAnimation(wordLabelEls) {
  const TOTAL = 5200;
  const FIRE_TIME   = 2800;
  const IMPACT_TIME = 3300;
  const EXIT_TIME   = 3500;

  return new Promise(resolve => {
    const startTime = performance.now();

    // Measure target (word labels centroid)
    const rects = wordLabelEls.map(el => el.getBoundingClientRect());
    const targetX = rects.reduce((s, r) => s + r.left + r.width / 2, 0) / rects.length;
    const targetY = rects.reduce((s, r) => s + r.top  + r.height / 2, 0) / rects.length;

    const w = W(), h = H();
    const tankW = Math.min(220, w * 0.22);
    const tankH = tankW * 0.4;
    const stopX  = w * 0.68;  // where tank stops (right side)
    const tankY  = h * 0.82;  // vertical position
    const wheelR = tankH * 0.28;

    let fired = false;
    let impacted = false;

    // Shell state
    const shell = { x: 0, y: 0, active: false, done: false };

    function drawTank(bx, turretAngle) {
      const cx = bx + tankW / 2;
      const cy = tankY;

      // Tracks (dark)
      ctx.fillStyle = '#2a2010';
      ctx.beginPath();
      roundRect(bx, cy - tankH * 0.22, tankW, tankH * 0.5, wheelR);
      ctx.fill();

      // Wheels
      ctx.fillStyle = '#1a1808';
      const wCount = 5;
      for (let i = 0; i < wCount; i++) {
        const wx = bx + wheelR + i * (tankW - 2 * wheelR) / (wCount - 1);
        ctx.beginPath();
        ctx.arc(wx, cy + tankH * 0.15, wheelR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3a3218';
        ctx.beginPath();
        ctx.arc(wx, cy + tankH * 0.15, wheelR * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1808';
      }

      // Hull
      ctx.fillStyle = '#8a9e50';
      ctx.beginPath();
      roundRect(bx + tankW * 0.04, cy - tankH * 0.55, tankW * 0.92, tankH * 0.52, 4);
      ctx.fill();

      // Hull highlight
      ctx.fillStyle = 'rgba(255,255,200,0.1)';
      ctx.beginPath();
      roundRect(bx + tankW * 0.06, cy - tankH * 0.52, tankW * 0.5, tankH * 0.16, 3);
      ctx.fill();

      // Turret base
      ctx.fillStyle = '#6a7e3e';
      ctx.beginPath();
      ctx.ellipse(cx, cy - tankH * 0.52, tankW * 0.27, tankH * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();

      // Barrel (rotates) — drawn LEFT in local space so angle 0 = left
      const barrelLen = tankW * 0.6;
      const barrelW   = tankH * 0.10;
      ctx.save();
      ctx.translate(cx, cy - tankH * 0.52);
      ctx.rotate(turretAngle);
      ctx.fillStyle = '#4a5c2a';
      ctx.fillRect(-barrelLen, -barrelW / 2, barrelLen, barrelW);
      // Muzzle cap
      ctx.fillStyle = '#3a4a20';
      ctx.fillRect(-barrelLen - barrelW * 0.4, -barrelW * 0.75, barrelW * 1.4, barrelW * 1.5);
      ctx.restore();

      // Hatch
      ctx.fillStyle = '#5a6e30';
      ctx.beginPath();
      ctx.ellipse(cx - tankW * 0.04, cy - tankH * 0.65, tankW * 0.1, tankH * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawShell(sx, sy) {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.fillStyle = '#d4a030';
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f0c040';
      ctx.beginPath();
      ctx.ellipse(-4, 0, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawExplosion(ex, ey, radius) {
      const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, radius);
      grad.addColorStop(0,   'rgba(255,255,200,0.95)');
      grad.addColorStop(0.3, 'rgba(255,180,30,0.85)');
      grad.addColorStop(0.7, 'rgba(255,80,10,0.6)');
      grad.addColorStop(1,   'rgba(100,30,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ex, ey, radius, 0, Math.PI * 2);
      ctx.fill();

      // Debris chunks
      ctx.fillStyle = '#4a3010';
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const dist  = radius * 0.6;
        const dx = ex + Math.cos(angle) * dist;
        const dy = ey + Math.sin(angle) * dist;
        ctx.fillRect(dx - 4, dy - 4, 8, 8);
      }
    }

    function loop(ts) {
      const elapsed = ts - startTime;
      const w = W(), h = H();
      ctx.clearRect(0, 0, w, h);

      // ── Phase 1: roll in ─────────────────────────────────────
      let tankX;
      // Barrel tip in world space = (turretX - barrelLen*cos(a), turretY - barrelLen*sin(a))
      // So: aimAngle = atan2(turretY - targetY, turretX - targetX)
      const turretY = tankY - tankH * 0.52;
      const aimAngle = Math.atan2(turretY - targetY, stopX - targetX);

      if (elapsed < 1600) {
        const t = elapsed / 1600;
        const ease = 1 - Math.pow(1 - t, 3);
        tankX = w + tankW * 0.5 - (w + tankW * 0.5 - stopX) * ease;
      } else if (elapsed < EXIT_TIME) {
        tankX = stopX;
      } else {
        // Exit to left
        const t = (elapsed - EXIT_TIME) / (TOTAL - EXIT_TIME);
        tankX = stopX - (stopX + tankW * 1.5) * t;
      }

      // ── Turret angle (interpolates from 0=left to aimAngle) ──
      let turretAngle = 0;
      if (elapsed >= 1600 && elapsed < EXIT_TIME) {
        const t = Math.min((elapsed - 1600) / 700, 1);
        turretAngle = aimAngle * t;
      }

      drawTank(tankX - tankW / 2, turretAngle);

      // ── Fire ─────────────────────────────────────────────────
      if (elapsed >= FIRE_TIME && !fired) {
        fired = true;
        // Muzzle is at -barrelLen along the (rotated) barrel
        const muzzleX = stopX + Math.cos(turretAngle) * (-tankW * 0.6);
        const muzzleY = (tankY - tankH * 0.52) + Math.sin(turretAngle) * (-tankW * 0.6);
        shell.x = muzzleX;
        shell.y = muzzleY;
        shell.active = true;
        shell.startX = muzzleX;
        shell.startY = muzzleY;
        shell.fireTime = elapsed;
      }

      if (shell.active && !shell.done) {
        const shellElapsed = elapsed - shell.fireTime;
        const shellDur = IMPACT_TIME - FIRE_TIME;
        const t = Math.min(shellElapsed / shellDur, 1);
        shell.x = shell.startX + (targetX - shell.startX) * t;
        shell.y = shell.startY + (targetY - shell.startY) * t - Math.sin(t * Math.PI) * 40;
        drawShell(shell.x, shell.y);

        if (t >= 1) shell.done = true;
      }

      // ── Impact ───────────────────────────────────────────────
      if (elapsed >= IMPACT_TIME && !impacted) {
        impacted = true;
        wordLabelEls.forEach(el => el.classList.add('exploding'));
      }

      if (elapsed >= IMPACT_TIME) {
        const expElapsed = elapsed - IMPACT_TIME;
        if (expElapsed < 800) {
          const radius = 20 + expElapsed * 0.25;
          const alpha  = 1 - expElapsed / 800;
          ctx.globalAlpha = alpha;
          drawExplosion(targetX, targetY, radius);
          ctx.globalAlpha = 1;
        }
      }

      if (elapsed < TOTAL) {
        requestAnimationFrame(loop);
      } else {
        ctx.clearRect(0, 0, w, h);
        resolve();
      }
    }

    requestAnimationFrame(loop);
  });
}
