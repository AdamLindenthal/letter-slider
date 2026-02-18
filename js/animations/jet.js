import { ctx, W, H } from '../canvas.js';

/**
 * Fighter Jet animation (very fast):
 *   0–700ms   Jet screams in from right (with condensation trail)
 *   700ms     Releases missile at closest approach to words
 *   900ms     Sonic-boom screen flash
 *   1100ms    Missile hits words → .exploding
 *   700–2500ms Jet exits left; explosion fades
 */
export function jetAnimation(wordLabelEls) {
  const TOTAL      = 2800;
  const RELEASE_AT = 700;
  const FLASH_AT   = 900;
  const IMPACT_AT  = 1100;

  return new Promise(resolve => {
    const startTime = performance.now();
    let released = false;
    let flashed  = false;
    let impacted = false;

    const rects = wordLabelEls.map(el => el.getBoundingClientRect());
    const targetX = rects.reduce((s, r) => s + r.left + r.width / 2, 0) / rects.length;
    const targetY = rects.reduce((s, r) => s + r.top  + r.height / 2, 0) / rects.length;

    const w = W(), h = H();
    const flightY = h * 0.28; // jet altitude

    // Contrail points
    const trail = [];
    const MAX_TRAIL = 80;

    // Missile state
    const missile = { x: 0, y: 0, active: false, done: false, fireTime: 0 };

    function drawJet(jx, jy) {
      ctx.save();
      ctx.translate(jx, jy);

      const scale = Math.min(1, w / 800);
      ctx.scale(scale, scale);

      // Afterburner flame
      const flame = ctx.createLinearGradient(30, 0, 90, 0);
      flame.addColorStop(0, 'rgba(255,200,30,0.95)');
      flame.addColorStop(0.5,'rgba(255,80,10,0.7)');
      flame.addColorStop(1, 'rgba(255,80,10,0)');
      ctx.fillStyle = flame;
      ctx.beginPath();
      ctx.moveTo(30, -5);
      ctx.lineTo(90, 0);
      ctx.lineTo(30, 5);
      ctx.closePath();
      ctx.fill();

      // Fuselage
      ctx.fillStyle = '#6a7a8a';
      ctx.beginPath();
      ctx.moveTo(-80, 0);   // nose
      ctx.lineTo(30, -6);   // top fuselage
      ctx.lineTo(30, 6);    // bottom fuselage
      ctx.closePath();
      ctx.fill();

      // Delta wings
      ctx.fillStyle = '#5a6a7a';
      ctx.beginPath();
      ctx.moveTo(-20, 0);
      ctx.lineTo(-60, -30);
      ctx.lineTo(-50, 0);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-20, 0);
      ctx.lineTo(-60, 30);
      ctx.lineTo(-50, 0);
      ctx.closePath();
      ctx.fill();

      // Canopy
      ctx.fillStyle = 'rgba(80,180,240,0.7)';
      ctx.beginPath();
      ctx.ellipse(-45, -5, 14, 7, -0.15, 0, Math.PI * 2);
      ctx.fill();

      // Tailfin
      ctx.fillStyle = '#4a5a6a';
      ctx.beginPath();
      ctx.moveTo(20, -6);
      ctx.lineTo(-5, -26);
      ctx.lineTo(-10, -6);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    function drawTrail(points) {
      if (points.length < 2) return;
      for (let i = 1; i < points.length; i++) {
        const t = i / points.length;
        ctx.strokeStyle = `rgba(220,235,255,${t * 0.4})`;
        ctx.lineWidth = 2 + t * 2;
        ctx.beginPath();
        ctx.moveTo(points[i-1].x, points[i-1].y);
        ctx.lineTo(points[i].x, points[i].y);
        ctx.stroke();
      }
    }

    function drawMissile(elapsed) {
      const dur = IMPACT_AT - RELEASE_AT;
      const t   = Math.min((elapsed - missile.fireTime) / dur, 1);
      const mx  = missile.x + (targetX - missile.x) * t;
      const my  = missile.y + (targetY - missile.y) * t;
      const angle = Math.atan2(targetY - missile.y, targetX - missile.x);

      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(angle);
      ctx.fillStyle = '#ccc';
      ctx.fillRect(-14, -2.5, 28, 5);
      ctx.fillStyle = 'rgba(255,140,20,0.8)';
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(26, -4);
      ctx.lineTo(26, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      if (t >= 1) missile.done = true;
    }

    function drawExplosion(ex, ey, progress) {
      const r = 14 + progress * 110;
      const a = Math.max(0, 1 - progress * 0.9);
      const g = ctx.createRadialGradient(ex, ey, 0, ex, ey, r);
      g.addColorStop(0, `rgba(255,255,220,${a})`);
      g.addColorStop(0.3,`rgba(255,160,20,${a * 0.9})`);
      g.addColorStop(0.7,`rgba(200,50,10,${a * 0.6})`);
      g.addColorStop(1, 'rgba(60,20,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(ex, ey, r, 0, Math.PI * 2);
      ctx.fill();
    }

    function loop(ts) {
      const elapsed = ts - startTime;
      ctx.clearRect(0, 0, W(), H());

      // Jet position (linear, very fast)
      const speed = (W() + 200) / (TOTAL * 0.001); // px/s — crosses screen in ~0.8 s
      const jx = W() + 100 - speed * (elapsed / 1000);
      const jy = flightY;

      // Trail
      if (elapsed < RELEASE_AT + 400) {
        trail.push({ x: jx + 30, y: jy });
        if (trail.length > MAX_TRAIL) trail.shift();
      } else if (trail.length > 0) {
        trail.shift();
      }
      drawTrail(trail);
      drawJet(jx, jy);

      // Release missile
      if (elapsed >= RELEASE_AT && !released) {
        released = true;
        missile.x = jx - 20;
        missile.y = jy;
        missile.active = true;
        missile.fireTime = elapsed;
      }
      if (missile.active && !missile.done) drawMissile(elapsed);

      // Screen flash (sonic boom)
      if (elapsed >= FLASH_AT && !flashed) {
        flashed = true;
      }
      if (flashed) {
        const flashAge = elapsed - FLASH_AT;
        if (flashAge < 180) {
          const alpha = (1 - flashAge / 180) * 0.35;
          ctx.fillStyle = `rgba(255,240,200,${alpha})`;
          ctx.fillRect(0, 0, W(), H());
        }
      }

      // Impact
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
