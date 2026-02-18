import { ctx, W, H } from '../canvas.js';

/**
 * Shotgun animation:
 *   0–400ms   Barrel slides in from right edge
 *   400ms     BLAST — muzzle flash + particle burst
 *   600ms     Word labels .exploding
 *   400–2500ms Particles fall with gravity
 *   2500ms    Done
 */
export function shotgunAnimation(wordLabelEls) {
  const TOTAL      = 2500;
  const BLAST_TIME = 400;
  const IMPACT_TIME = 600;

  return new Promise(resolve => {
    const startTime = performance.now();
    let blasted  = false;
    let impacted = false;

    const w = W(), h = H();
    const barrelY  = h * 0.5;
    const barrelLen = Math.min(280, w * 0.28);
    const barrelH   = 24;
    const muzzleX   = w - (barrelLen * 0.08); // muzzle is near right side when slid in

    // Particle system
    const particles = [];
    function spawnParticles() {
      const count = 60;
      const spread = 0.85; // radians of spread cone (pointing left)
      for (let i = 0; i < count; i++) {
        const angle = Math.PI + (Math.random() - 0.5) * spread;
        const speed = 120 + Math.random() * 280;
        particles.push({
          x:    muzzleX,
          y:    barrelY,
          vx:   Math.cos(angle) * speed,
          vy:   Math.sin(angle) * speed - 30,
          size: 2 + Math.random() * 5,
          color: Math.random() < 0.4 ? '#ff8020' : (Math.random() < 0.5 ? '#ffdd40' : '#cccccc'),
          life: 1,
          decay: 0.4 + Math.random() * 0.5,
        });
      }
    }

    function drawBarrel(progress) {
      // Slide in: comes from right, muzzle leads
      const slideOffset = (1 - progress) * (barrelLen * 0.9);
      const bx = w - barrelLen + slideOffset;

      // Stock (wooden, darker)
      ctx.fillStyle = '#7a4010';
      ctx.fillRect(bx, barrelY - barrelH / 2 - 4, barrelLen * 0.45, barrelH * 1.25);

      // Barrel (metal)
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(bx + barrelLen * 0.3, barrelY - barrelH / 2, barrelLen * 0.7, barrelH);

      // Guard
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(bx + barrelLen * 0.38, barrelY + barrelH / 2, barrelLen * 0.08, barrelH * 0.6);

      // Barrel highlight
      ctx.fillStyle = 'rgba(200,200,200,0.15)';
      ctx.fillRect(bx + barrelLen * 0.3, barrelY - barrelH / 2, barrelLen * 0.7, barrelH * 0.28);

      // Muzzle ring
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.arc(bx + barrelLen, barrelY, barrelH * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(bx + barrelLen, barrelY, barrelH * 0.38, 0, Math.PI * 2);
      ctx.fill();

      return bx + barrelLen; // actual muzzle X after slide
    }

    function drawMuzzleFlash(mx, my, age) {
      if (age > 0.25) return;
      const r = 35 + age * 80;
      const alpha = 1 - age / 0.25;
      const grad = ctx.createRadialGradient(mx, my, 0, mx, my, r);
      grad.addColorStop(0,   `rgba(255,255,200,${alpha})`);
      grad.addColorStop(0.4, `rgba(255,200,50,${alpha * 0.8})`);
      grad.addColorStop(1,   `rgba(255,100,10,0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mx, my, r, 0, Math.PI * 2);
      ctx.fill();
    }

    let lastTs = null;
    function loop(ts) {
      const elapsed = ts - startTime;
      const dt = lastTs !== null ? (ts - lastTs) / 1000 : 0;
      lastTs = ts;

      const w = W(), h = H();
      ctx.clearRect(0, 0, w, h);

      // Draw barrel
      const slideProgress = Math.min(elapsed / BLAST_TIME, 1);
      const actualMuzzleX = drawBarrel(slideProgress);

      if (elapsed >= BLAST_TIME && !blasted) {
        blasted = true;
        spawnParticles();
      }

      if (blasted && elapsed < BLAST_TIME + 300) {
        const age = (elapsed - BLAST_TIME) / 1000;
        drawMuzzleFlash(actualMuzzleX, barrelY, age);
      }

      if (elapsed >= IMPACT_TIME && !impacted) {
        impacted = true;
        wordLabelEls.forEach(el => el.classList.add('exploding'));
      }

      // Update + draw particles
      for (const p of particles) {
        if (p.life <= 0) continue;
        p.x  += p.vx * dt;
        p.y  += p.vy * dt;
        p.vy += 400 * dt; // gravity
        p.vx *= 0.98;
        p.life -= p.decay * dt;

        const alpha = Math.max(0, p.life);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

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
