import { ctx, W, H } from '../canvas.js';

/**
 * Bomber animation (slow, methodical):
 *   0–2500ms  Heavy bomber lumbers in from right
 *   2500ms    First bomb drops (over word 0)
 *   3000ms    Second bomb drops (over word 1)
 *   3500ms    Third bomb drops (over word 2)
 *   2700ms / 3200ms / 3700ms  Each bomb hits → partial .exploding per word
 *   3700ms    All words .exploding
 *   3700–6000ms Bomber exits left; explosions fade
 */
export function bomberAnimation(wordLabelEls) {
  const TOTAL = 6200;
  // Times when each bomb is dropped
  const DROP_TIMES   = [2500, 3000, 3500];
  const IMPACT_TIMES = [2800, 3300, 3800];

  return new Promise(resolve => {
    const startTime = performance.now();
    const droppedBombs  = [false, false, false];
    const impactedWords = [false, false, false];
    let allImpacted = false;

    const rects = wordLabelEls.map(el => el.getBoundingClientRect());
    const w = W(), h = H();

    // Bomber altitude
    const bomberY = h * 0.2;

    // Each bomb targets the corresponding word label (or spread evenly)
    const targets = rects.map(r => ({
      x: r.left + r.width  / 2,
      y: r.top  + r.height / 2,
    }));
    // Fill in if fewer than 3 word labels
    while (targets.length < 3) {
      targets.push(targets[targets.length - 1] || { x: w / 2, y: h / 2 });
    }

    // Bomb state array
    const bombs = [0, 1, 2].map(() => ({
      x: 0, y: 0, vy: 0,
      active: false, done: false, dropTime: 0,
    }));

    // Explosion states
    const explosions = [0, 1, 2].map(() => ({ startTime: 0, active: false }));

    function drawBomber(bx, by) {
      ctx.save();
      ctx.translate(bx, by);

      const scale = Math.min(1, w / 900);
      ctx.scale(scale, scale);

      const bodyW = 140;
      const bodyH = 28;

      // Wings (swept)
      ctx.fillStyle = '#5a6040';
      ctx.beginPath();
      ctx.moveTo(-bodyW * 0.3, 0);
      ctx.lineTo(-bodyW * 0.7, -55);
      ctx.lineTo(-bodyW * 0.8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-bodyW * 0.3, 0);
      ctx.lineTo(-bodyW * 0.7, 55);
      ctx.lineTo(-bodyW * 0.8, 0);
      ctx.closePath();
      ctx.fill();

      // Engines (2 pairs on wings)
      const engines = [[-bodyW * 0.5, -32], [-bodyW * 0.6, -50],
                       [-bodyW * 0.5,  32], [-bodyW * 0.6,  50]];
      for (const [ex, ey] of engines) {
        ctx.fillStyle = '#3a3a28';
        ctx.beginPath();
        ctx.ellipse(ex, ey, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Exhaust
        ctx.fillStyle = 'rgba(255,180,30,0.7)';
        ctx.beginPath();
        ctx.ellipse(ex + 12, ey, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Fuselage
      ctx.fillStyle = '#6a7050';
      ctx.beginPath();
      ctx.ellipse(0, 0, bodyW * 0.5, bodyH * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cockpit
      ctx.fillStyle = 'rgba(100,180,230,0.65)';
      ctx.beginPath();
      ctx.ellipse(bodyW * 0.35, -bodyH * 0.2, 18, 9, -0.1, 0, Math.PI * 2);
      ctx.fill();

      // Tail
      ctx.fillStyle = '#5a6040';
      ctx.beginPath();
      ctx.moveTo(-bodyW * 0.48, 0);
      ctx.lineTo(-bodyW * 0.5, -35);
      ctx.lineTo(-bodyW * 0.4, 0);
      ctx.closePath();
      ctx.fill();

      // Bomb bay door indicator (open when dropping)
      ctx.fillStyle = '#2a2a18';
      ctx.fillRect(-bodyW * 0.12, bodyH * 0.35, bodyW * 0.25, 6);

      ctx.restore();
    }

    function drawBombInFlight(bx, by, targetX, targetY) {
      const angle = Math.atan2(targetY - by, targetX - bx);
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(angle);
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#666';
      ctx.fillRect(-3, -11, 6, 4);
      ctx.restore();
    }

    function drawExplosionAt(ex, ey, progress) {
      const r = 10 + progress * 90;
      const a = Math.max(0, 1 - progress * 0.88);
      const g = ctx.createRadialGradient(ex, ey, 0, ex, ey, r);
      g.addColorStop(0, `rgba(255,255,200,${a})`);
      g.addColorStop(0.3,`rgba(255,150,20,${a * 0.88})`);
      g.addColorStop(0.7,`rgba(180,50,10,${a * 0.6})`);
      g.addColorStop(1,  'rgba(50,15,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(ex, ey, r, 0, Math.PI * 2);
      ctx.fill();
    }

    function getBomberX(elapsed) {
      // Lumbers across screen at steady speed
      const totalDist = W() + 300;
      const speed     = totalDist / (TOTAL * 0.001); // px/s
      return W() + 150 - speed * (elapsed / 1000);
    }

    let lastTs = null;
    function loop(ts) {
      const elapsed = ts - startTime;
      const dt = lastTs !== null ? (ts - lastTs) / 1000 : 0.016;
      lastTs = ts;
      ctx.clearRect(0, 0, W(), H());

      const bx = getBomberX(elapsed);
      drawBomber(bx, bomberY);

      // Drop bombs at scheduled times
      for (let i = 0; i < 3; i++) {
        if (elapsed >= DROP_TIMES[i] && !droppedBombs[i]) {
          droppedBombs[i] = true;
          bombs[i].x       = bx;
          bombs[i].y       = bomberY + 20;
          bombs[i].vy      = 60;
          bombs[i].active  = true;
          bombs[i].dropTime = elapsed;
        }
        if (bombs[i].active && !bombs[i].done) {
          bombs[i].vy += 380 * dt;
          bombs[i].y  += bombs[i].vy * dt;
          // Slight horizontal drift (following bomber momentum)
          bombs[i].x  += (-30) * dt;
          if (bombs[i].y >= targets[i].y) {
            bombs[i].done = true;
          } else {
            drawBombInFlight(bombs[i].x, bombs[i].y, targets[i].x, targets[i].y);
          }
        }
      }

      // Impacts
      for (let i = 0; i < 3; i++) {
        if (elapsed >= IMPACT_TIMES[i] && !impactedWords[i]) {
          impactedWords[i] = true;
          explosions[i].active    = true;
          explosions[i].startTime = elapsed;
          if (wordLabelEls[i]) wordLabelEls[i].classList.add('exploding');
        }
        if (explosions[i].active) {
          const prog = Math.min((elapsed - explosions[i].startTime) / 1000, 1);
          drawExplosionAt(targets[i].x, targets[i].y, prog);
        }
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
