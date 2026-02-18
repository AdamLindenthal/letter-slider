import { ctx, W, H } from '../canvas.js';

/**
 * TNT animation:
 *   0–1800ms  TNT crate on screen, fuse burns (zigzag shortens)
 *   1800ms    EXPLOSION — word labels .exploding
 *   1800–3500ms Blocky chunk debris
 *   3500ms    Done
 */
export function tntAnimation(wordLabelEls) {
  const TOTAL      = 3500;
  const EXPLODE_AT = 1800;

  return new Promise(resolve => {
    const startTime = performance.now();
    let exploded = false;

    const w = W(), h = H();
    const rects = wordLabelEls.map(el => el.getBoundingClientRect());
    const cx = rects.reduce((s, r) => s + r.left + r.width / 2, 0) / rects.length;
    const cy = rects.reduce((s, r) => s + r.top + r.height / 2, 0) / rects.length;

    const crateW = Math.min(120, w * 0.12);
    const crateH = crateW * 0.9;
    const crateX = cx - crateW / 2;
    const crateY = h * 0.55;

    // Fuse path (zigzag points)
    const fusePoints = [];
    const fuseStartX = cx;
    const fuseStartY = crateY;
    const fuseLen = 80;
    const segments = 6;
    for (let i = 0; i <= segments; i++) {
      const t   = i / segments;
      const fx  = fuseStartX + (i % 2 === 0 ? -15 : 15);
      const fy  = fuseStartY - t * fuseLen;
      fusePoints.push({ x: fx, y: fy });
    }
    // Ensure start
    fusePoints[0] = { x: fuseStartX, y: fuseStartY };

    // Debris chunks
    const chunks = [];
    function spawnChunks() {
      const colors = ['#cc2020','#ffffff','#dd3030','#ee4040'];
      for (let i = 0; i < 24; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 80 + Math.random() * 250;
        chunks.push({
          x:    cx,
          y:    crateY + crateH / 2,
          vx:   Math.cos(angle) * speed,
          vy:   Math.sin(angle) * speed - 120,
          size: 6 + Math.random() * 18,
          color: colors[Math.floor(Math.random() * colors.length)],
          rot:  Math.random() * Math.PI * 2,
          rotV: (Math.random() - 0.5) * 8,
          life: 1,
        });
      }
    }

    function drawCrate(opacity) {
      ctx.globalAlpha = opacity;

      // Main body (red)
      ctx.fillStyle = '#cc2020';
      ctx.fillRect(crateX, crateY, crateW, crateH);

      // White stripes
      const stripeW = crateW / 6;
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(crateX + stripeW * (i * 2 + 1), crateY, stripeW, crateH);
      }

      // Border
      ctx.strokeStyle = '#880000';
      ctx.lineWidth = 3;
      ctx.strokeRect(crateX, crateY, crateW, crateH);

      // "TNT" text
      ctx.fillStyle = '#000';
      ctx.font = `bold ${crateW * 0.28}px Impact, Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TNT', cx, crateY + crateH / 2);

      ctx.globalAlpha = 1;
    }

    function drawFuse(progress) {
      // progress 0→1 means fuse fully burned (starts full, shrinks to nothing)
      const burnedTo = progress; // what fraction of fuse is burned
      const remainingPoints = Math.ceil((1 - burnedTo) * (fusePoints.length - 1));

      if (remainingPoints < 1) return;

      ctx.strokeStyle = '#8a6020';
      ctx.lineWidth   = 3;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();

      const endIdx = fusePoints.length - 1;
      const startIdx = Math.max(0, endIdx - remainingPoints);
      ctx.moveTo(fusePoints[startIdx].x, fusePoints[startIdx].y);
      for (let i = startIdx + 1; i <= endIdx; i++) {
        ctx.lineTo(fusePoints[i].x, fusePoints[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Spark at fuse tip
      const tipIdx = startIdx;
      const spark = fusePoints[Math.max(0, tipIdx)];
      ctx.fillStyle = '#ffdd00';
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff8800';
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawExplosion(ex, ey, progress) {
      const r = 15 + progress * 130;
      const alpha = Math.max(0, 1 - progress * 0.9);

      // Core
      const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, r);
      grad.addColorStop(0,   `rgba(255,255,200,${alpha})`);
      grad.addColorStop(0.3, `rgba(255,180,30,${alpha * 0.9})`);
      grad.addColorStop(0.7, `rgba(200,50,10,${alpha * 0.6})`);
      grad.addColorStop(1,   `rgba(60,20,0,0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ex, ey, r, 0, Math.PI * 2);
      ctx.fill();

      // Blocky smoke
      ctx.fillStyle = `rgba(60,50,40,${alpha * 0.5})`;
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const dist  = r * 0.55;
        const sx = ex + Math.cos(angle) * dist;
        const sy = ey + Math.sin(angle) * dist;
        const sz = 12 + progress * 25;
        ctx.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
      }
    }

    let lastTs = null;
    function loop(ts) {
      const elapsed = ts - startTime;
      const dt = lastTs !== null ? (ts - lastTs) / 1000 : 0;
      lastTs = ts;

      const w = W(), h = H();
      ctx.clearRect(0, 0, w, h);

      if (elapsed < EXPLODE_AT) {
        // Show crate + burning fuse
        const fuseProgress = elapsed / EXPLODE_AT;
        drawCrate(1);
        drawFuse(fuseProgress);
      }

      if (elapsed >= EXPLODE_AT) {
        if (!exploded) {
          exploded = true;
          spawnChunks();
          wordLabelEls.forEach(el => el.classList.add('exploding'));
        }

        const expProgress = Math.min((elapsed - EXPLODE_AT) / 900, 1);
        drawExplosion(cx, crateY + crateH / 2, expProgress);

        // Update + draw chunks
        for (const c of chunks) {
          if (c.life <= 0) continue;
          c.x  += c.vx * dt;
          c.y  += c.vy * dt;
          c.vy += 380 * dt;
          c.vx *= 0.985;
          c.rot += c.rotV * dt;
          c.life -= 0.35 * dt;

          ctx.save();
          ctx.translate(c.x, c.y);
          ctx.rotate(c.rot);
          ctx.globalAlpha = Math.max(0, c.life);
          ctx.fillStyle = c.color;
          ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size);
          ctx.globalAlpha = 1;
          ctx.restore();
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
