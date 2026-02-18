import { ctx, W, H } from '../canvas.js';

/**
 * Helicopter animation:
 *   0–2000ms  Gunship flies in from right
 *   2000–3200ms Hovers, targeting reticle locks on
 *   3200ms    Fires rocket
 *   3600ms    Impact → .exploding
 *   3600–5500ms Helicopter banks and exits left
 */
export function helicopterAnimation(wordLabelEls) {
  const TOTAL     = 5500;
  const HOVER_AT  = 2000;
  const FIRE_AT   = 3200;
  const IMPACT_AT = 3600;
  const EXIT_AT   = 3700;

  return new Promise(resolve => {
    const startTime = performance.now();
    let fired    = false;
    let impacted = false;

    const rects = wordLabelEls.map(el => el.getBoundingClientRect());
    const targetX = rects.reduce((s, r) => s + r.left + r.width / 2, 0) / rects.length;
    const targetY = rects.reduce((s, r) => s + r.top  + r.height / 2, 0) / rects.length;

    const w = W(), h = H();
    const hoverX = w * 0.72;
    const hoverY = h * 0.35;

    // Rocket state
    const rocket = { x: 0, y: 0, active: false, done: false, fireTime: 0 };

    function drawHelicopter(hx, hy, bank, rotorPhase) {
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(bank);

      const bodyW = 80;
      const bodyH = 28;

      // Tail boom
      ctx.fillStyle = '#4a5030';
      ctx.fillRect(-bodyW * 0.5, -6, -bodyW * 0.7, 10);

      // Tail rotor
      ctx.save();
      ctx.translate(-bodyW * 1.2, -2);
      ctx.rotate(rotorPhase * 4);
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate(i * Math.PI * 2 / 3);
        ctx.fillStyle = 'rgba(80,100,60,0.75)';
        ctx.fillRect(0, -2, 18, 4);
        ctx.restore();
      }
      ctx.restore();

      // Body
      ctx.fillStyle = '#5a6a38';
      ctx.beginPath();
      ctx.ellipse(0, 0, bodyW * 0.5, bodyH * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cockpit glass
      ctx.fillStyle = 'rgba(120,200,240,0.6)';
      ctx.beginPath();
      ctx.ellipse(bodyW * 0.28, -4, bodyW * 0.22, bodyH * 0.4, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Skids
      ctx.strokeStyle = '#3a4028';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-bodyW * 0.35, bodyH * 0.4);
      ctx.lineTo( bodyW * 0.35, bodyH * 0.4);
      ctx.moveTo(-bodyW * 0.2, bodyH * 0.4);
      ctx.lineTo(-bodyW * 0.2, bodyH * 0.65);
      ctx.moveTo( bodyW * 0.2, bodyH * 0.4);
      ctx.lineTo( bodyW * 0.2, bodyH * 0.65);
      ctx.stroke();

      // Main rotor
      ctx.save();
      ctx.translate(0, -bodyH * 0.5);
      ctx.rotate(rotorPhase);
      ctx.fillStyle = 'rgba(60,80,40,0.8)';
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate(i * Math.PI * 2 / 3);
        ctx.fillRect(0, -4, bodyW * 0.85, 8);
        ctx.restore();
      }
      ctx.restore();

      // Rocket pod (underside)
      ctx.fillStyle = '#3a3a20';
      ctx.fillRect(-bodyW * 0.08, bodyH * 0.2, bodyW * 0.28, 10);

      ctx.restore();
    }

    function drawRocket(rx, ry, elapsed) {
      const dur  = IMPACT_AT - FIRE_AT;
      const t    = Math.min((elapsed - rocket.fireTime) / dur, 1);
      const x    = rocket.x + (targetX - rocket.x) * t;
      const y    = rocket.y + (targetY - rocket.y) * t;
      const angle = Math.atan2(targetY - rocket.y, targetX - rocket.x);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = '#888';
      ctx.fillRect(-16, -3, 32, 6);
      // Exhaust flame
      ctx.fillStyle = 'rgba(255,150,30,0.85)';
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(-28, -5);
      ctx.lineTo(-28, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      if (t >= 1) rocket.done = true;
    }

    function drawExplosion(ex, ey, progress) {
      const r = 12 + progress * 100;
      const a = Math.max(0, 1 - progress * 0.9);
      const g = ctx.createRadialGradient(ex, ey, 0, ex, ey, r);
      g.addColorStop(0,   `rgba(255,255,200,${a})`);
      g.addColorStop(0.35,`rgba(255,160,30,${a * 0.88})`);
      g.addColorStop(0.7, `rgba(200,50,10,${a * 0.6})`);
      g.addColorStop(1,   'rgba(60,20,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(ex, ey, r, 0, Math.PI * 2);
      ctx.fill();
    }

    function loop(ts) {
      const elapsed = ts - startTime;
      ctx.clearRect(0, 0, W(), H());

      const rotorPhase = elapsed * 0.012;
      let hx, hy, bank = 0;

      if (elapsed < HOVER_AT) {
        const t    = elapsed / HOVER_AT;
        const ease = 1 - Math.pow(1 - t, 3);
        hx   = W() + 100 + (hoverX - W() - 100) * ease;
        hy   = hoverY;
        bank = -0.1 * (1 - ease);
      } else if (elapsed < EXIT_AT) {
        hx   = hoverX + Math.sin(elapsed * 0.002) * 10;
        hy   = hoverY + Math.sin(elapsed * 0.003) * 6;
        bank = Math.sin(elapsed * 0.002) * 0.06;
      } else {
        const t    = (elapsed - EXIT_AT) / (TOTAL - EXIT_AT);
        const ease = t * t;
        hx   = hoverX - ease * (hoverX + 120);
        hy   = hoverY - ease * h * 0.15;
        bank = 0.08;
      }

      drawHelicopter(hx, hy, bank, rotorPhase);

      // Fire rocket
      if (elapsed >= FIRE_AT && !fired) {
        fired = true;
        rocket.x = hx - 25;
        rocket.y = hy + 10;
        rocket.active = true;
        rocket.fireTime = elapsed;
      }

      if (rocket.active && !rocket.done) {
        drawRocket(0, 0, elapsed);
      }

      if (elapsed >= IMPACT_AT && !impacted) {
        impacted = true;
        wordLabelEls.forEach(el => el.classList.add('exploding'));
      }

      if (elapsed >= IMPACT_AT) {
        const prog = Math.min((elapsed - IMPACT_AT) / 1000, 1);
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
