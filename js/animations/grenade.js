import { ctx, W, H } from '../canvas.js';

/**
 * Grenade animation:
 *   0–1300ms  Grenade thrown in parabolic arc from right
 *   1300ms    Landing: explosion, word labels .exploding
 *   1300–2800ms Shockwave rings
 *   3000ms    Done
 */
export function grenadeAnimation(wordLabelEls) {
  const TOTAL       = 3000;
  const LAND_TIME   = 1300;

  return new Promise(resolve => {
    const startTime = performance.now();
    let exploded = false;

    // Target: centroid of word labels
    const rects = wordLabelEls.map(el => el.getBoundingClientRect());
    const landX = rects.reduce((s, r) => s + r.left + r.width / 2, 0) / rects.length;
    const landY = rects.reduce((s, r) => s + r.top  + r.height / 2, 0) / rects.length;

    const w = W(), h = H();
    const startX = w + 40;
    const startY = h * 0.15;

    // Parabola: launch from top-right, land at target
    function getGrenadePos(t) {
      // t in [0,1]
      const x = startX + (landX - startX) * t;
      // parabolic y: starts at startY, rises then falls to landY
      const yLinear = startY + (landY - startY) * t;
      const arc = -Math.sin(t * Math.PI) * (h * 0.35);
      return { x, y: yLinear + arc };
    }

    function drawGrenade(gx, gy, angle) {
      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(angle);

      // Body
      ctx.fillStyle = '#3a5a20';
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ridges
      ctx.strokeStyle = '#2a4010';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-14, -6); ctx.lineTo(14, -6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-14, 0);  ctx.lineTo(14, 0);  ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-14, 6);  ctx.lineTo(14, 6);  ctx.stroke();

      // Top cap + handle
      ctx.fillStyle = '#2a4010';
      ctx.fillRect(-5, -24, 10, 8);

      // Pin ring
      ctx.strokeStyle = '#d0c060';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(6, -22, 5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    function drawExplosion(ex, ey, progress) {
      // Fireball
      const r = 10 + progress * 90;
      const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, r);
      grad.addColorStop(0,   'rgba(255,255,200,1)');
      grad.addColorStop(0.25,'rgba(255,200,50,0.9)');
      grad.addColorStop(0.6, 'rgba(255,80,10,0.7)');
      grad.addColorStop(1,   'rgba(80,20,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ex, ey, r, 0, Math.PI * 2);
      ctx.fill();

      // Smoke wisps
      if (progress > 0.3) {
        ctx.fillStyle = `rgba(80,80,80,${0.4 * (1 - progress)})`;
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2;
          const dist  = r * 0.7;
          ctx.beginPath();
          ctx.arc(
            ex + Math.cos(angle) * dist,
            ey + Math.sin(angle) * dist,
            8 + progress * 20,
            0, Math.PI * 2
          );
          ctx.fill();
        }
      }
    }

    function drawShockwave(ex, ey, progress, waveIndex) {
      const maxR = 160 + waveIndex * 60;
      const r    = progress * maxR;
      const alpha = Math.max(0, 0.7 - progress * 0.8 - waveIndex * 0.15);
      if (alpha <= 0) return;
      ctx.strokeStyle = `rgba(255,200,80,${alpha})`;
      ctx.lineWidth = Math.max(1, 4 - progress * 4);
      ctx.beginPath();
      ctx.arc(ex, ey, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    function loop(ts) {
      const elapsed = ts - startTime;
      const w = W(), h = H();
      ctx.clearRect(0, 0, w, h);

      if (elapsed < LAND_TIME) {
        const t = elapsed / LAND_TIME;
        const { x, y } = getGrenadePos(t);
        const angle = t * Math.PI * 4; // spin during flight
        drawGrenade(x, y, angle);
      }

      if (elapsed >= LAND_TIME) {
        if (!exploded) {
          exploded = true;
          wordLabelEls.forEach(el => el.classList.add('exploding'));
        }

        const expElapsed = elapsed - LAND_TIME;
        const expDur = TOTAL - LAND_TIME;
        const progress = expElapsed / expDur;

        // Explosion fades out
        if (expElapsed < 800) {
          drawExplosion(landX, landY, Math.min(expElapsed / 600, 1));
        }

        // Up to 3 shockwave rings
        for (let i = 0; i < 3; i++) {
          const waveStart = i * 250;
          if (expElapsed >= waveStart) {
            const wp = (expElapsed - waveStart) / 1200;
            if (wp < 1) drawShockwave(landX, landY, wp, i);
          }
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
