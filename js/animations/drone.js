import { ctx, W, H } from '../canvas.js';

/**
 * Drone animation:
 *   0–1400ms  Quadcopter flies in from top-right
 *   1400–2200ms Hovers above words, crosshair targeting
 *   2200ms    Drops payload (small bomb)
 *   2600ms    Impact → .exploding on word labels
 *   2600–4000ms Explosion, drone exits top-left
 */
export function droneAnimation(wordLabelEls) {
  const TOTAL     = 4200;
  const HOVER_AT  = 1400;
  const DROP_AT   = 2200;
  const IMPACT_AT = 2600;
  const EXIT_AT   = 2700;

  return new Promise(resolve => {
    const startTime = performance.now();
    let dropped = false;
    let impacted = false;

    const rects = wordLabelEls.map(el => el.getBoundingClientRect());
    const targetX = rects.reduce((s, r) => s + r.left + r.width / 2, 0) / rects.length;
    const targetY = rects.reduce((s, r) => s + r.top + r.height / 2, 0) / rects.length;

    const w = W(), h = H();
    const hoverX = targetX;
    const hoverY = targetY - h * 0.25;

    // Payload state
    const bomb = { x: 0, y: 0, vy: 0, active: false, done: false, fireTime: 0 };

    function drawDrone(dx, dy, rot) {
      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(rot);

      const armLen = 22;
      const rotorR = 10;

      // Arms (cross)
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 4;
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.rotate(i * Math.PI / 2 + Math.PI / 4);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(armLen, 0);
        ctx.stroke();
        // Rotor disc
        ctx.fillStyle = 'rgba(100,180,255,0.45)';
        ctx.beginPath();
        ctx.arc(armLen, 0, rotorR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3a3';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // Body
      ctx.fillStyle = '#2a2a2a';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      // LED blink
      ctx.fillStyle = 'rgba(255,255,100,0.9)';
      ctx.beginPath();
      ctx.arc(0, -9, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    function drawCrosshair(cx, cy, size, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 1.5;
      // Outer circle
      ctx.beginPath();
      ctx.arc(cx, cy, size, 0, Math.PI * 2);
      ctx.stroke();
      // Inner circle
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2);
      ctx.stroke();
      // Cross hairs
      ctx.beginPath();
      ctx.moveTo(cx - size * 1.3, cy); ctx.lineTo(cx - size * 0.5, cy);
      ctx.moveTo(cx + size * 0.5, cy); ctx.lineTo(cx + size * 1.3, cy);
      ctx.moveTo(cx, cy - size * 1.3); ctx.lineTo(cx, cy - size * 0.5);
      ctx.moveTo(cx, cy + size * 0.5); ctx.lineTo(cx, cy + size * 1.3);
      ctx.stroke();
      ctx.restore();
    }

    function drawBomb(bx, by) {
      ctx.save();
      ctx.translate(bx, by);
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#888';
      ctx.fillRect(-3, -12, 6, 4);
      ctx.restore();
    }

    function drawExplosion(ex, ey, progress) {
      const r = 10 + progress * 80;
      const alpha = Math.max(0, 1 - progress * 0.85);
      const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, r);
      grad.addColorStop(0,   `rgba(255,255,200,${alpha})`);
      grad.addColorStop(0.3, `rgba(255,160,20,${alpha * 0.85})`);
      grad.addColorStop(0.7, `rgba(220,50,10,${alpha * 0.6})`);
      grad.addColorStop(1,   'rgba(80,20,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ex, ey, r, 0, Math.PI * 2);
      ctx.fill();
    }

    function loop(ts) {
      const elapsed = ts - startTime;
      ctx.clearRect(0, 0, W(), H());

      let droneX, droneY, droneRot = 0;

      if (elapsed < HOVER_AT) {
        // Fly in from top-right
        const t = elapsed / HOVER_AT;
        const ease = 1 - Math.pow(1 - t, 3);
        droneX = W() + 60 + (hoverX - W() - 60) * ease;
        droneY = -60 + (hoverY + 60) * ease;
      } else if (elapsed < EXIT_AT) {
        // Hover with subtle bob
        droneX = hoverX + Math.sin(elapsed * 0.003) * 8;
        droneY = hoverY + Math.sin(elapsed * 0.005) * 5;
        droneRot = Math.sin(elapsed * 0.004) * 0.08;
      } else {
        // Exit to top-left
        const t = (elapsed - EXIT_AT) / (TOTAL - EXIT_AT);
        const ease = t * t;
        droneX = hoverX - ease * (hoverX + 80);
        droneY = hoverY - ease * (H() * 0.5);
      }

      drawDrone(droneX, droneY, droneRot);

      // Crosshair during hover
      if (elapsed >= HOVER_AT && elapsed < DROP_AT) {
        const t = (elapsed - HOVER_AT) / (DROP_AT - HOVER_AT);
        const size = 40 - t * 20;
        const alpha = 0.3 + t * 0.5;
        drawCrosshair(targetX, targetY, size, alpha);
      }

      // Bomb
      if (elapsed >= DROP_AT && !dropped) {
        dropped = true;
        bomb.x = droneX;
        bomb.y = droneY;
        bomb.vy = 0;
        bomb.active = true;
        bomb.fireTime = elapsed;
      }

      if (bomb.active && !bomb.done) {
        const dt = 0.016;
        bomb.vy += 600 * dt;
        bomb.y  += bomb.vy * dt;

        if (bomb.y >= targetY) {
          bomb.done = true;
        } else {
          drawBomb(bomb.x, bomb.y);
        }
      }

      if (elapsed >= IMPACT_AT && !impacted) {
        impacted = true;
        wordLabelEls.forEach(el => el.classList.add('exploding'));
      }

      if (elapsed >= IMPACT_AT) {
        const prog = Math.min((elapsed - IMPACT_AT) / 900, 1);
        drawExplosion(targetX, targetY, prog);
      }

      if (elapsed < TOTAL) {
        requestAnimationFrame(loop);
      } else {
        ctx.clearRect(0, 0, W(), H());
        resolve();
      }
    }

    requestAnimationFrame(loop);
  });
}
