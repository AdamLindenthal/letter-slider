import { ctx, W, H } from '../canvas.js';

/**
 * Atomic animation:
 *   0–600ms   Screen trembles (CSS shake on body)
 *   600–1800ms Mushroom cloud grows from bottom
 *   1800ms    BLAST: orange screen flash, word labels .exploding
 *   1800–4000ms Cloud fully formed, dissipates
 *   4000ms    Done
 */
export function atomicAnimation(wordLabelEls) {
  const TOTAL      = 4000;
  const BLAST_AT   = 1800;

  return new Promise(resolve => {
    const startTime = performance.now();
    let blasted = false;

    // Shake body slightly during buildup
    const body = document.body;
    let shakeInterval = setInterval(() => {
      if (blasted) { clearInterval(shakeInterval); body.style.transform = ''; return; }
      const dx = (Math.random() - 0.5) * 4;
      const dy = (Math.random() - 0.5) * 4;
      body.style.transform = `translate(${dx}px, ${dy}px)`;
    }, 80);

    function drawMushroom(cx, baseY, progress) {
      const w = W(), h = H();

      // Stem height grows
      const stemH   = Math.min(h * 0.45, h * 0.45 * progress * 1.3);
      const stemTopY = baseY - stemH;
      const stemW    = Math.min(60, w * 0.06);

      // Cap expands
      const capRx = Math.min(w * 0.25, w * 0.25 * progress * 1.1);
      const capRy = Math.min(h * 0.18, h * 0.18 * progress * 1.1);

      // Glow behind
      const glowR = capRx * 1.6;
      const glow  = ctx.createRadialGradient(cx, stemTopY, 0, cx, stemTopY, glowR);
      const alpha  = Math.min(progress * 1.5, 0.6);
      glow.addColorStop(0,   `rgba(255,200,30,${alpha})`);
      glow.addColorStop(0.5, `rgba(200,80,10,${alpha * 0.5})`);
      glow.addColorStop(1,   'rgba(100,30,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(cx, stemTopY, glowR, glowR * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Stem (pillar of smoke)
      const stemGrad = ctx.createLinearGradient(cx - stemW / 2, stemTopY, cx + stemW / 2, stemTopY);
      stemGrad.addColorStop(0,   'rgba(100,80,50,0.8)');
      stemGrad.addColorStop(0.5, 'rgba(160,130,80,0.9)');
      stemGrad.addColorStop(1,   'rgba(100,80,50,0.8)');
      ctx.fillStyle = stemGrad;
      ctx.beginPath();
      ctx.rect(cx - stemW / 2, stemTopY, stemW, stemH);
      ctx.fill();

      // Cap — mushroom top (oval)
      const capGrad = ctx.createRadialGradient(cx, stemTopY - capRy * 0.4, 0, cx, stemTopY, capRx);
      capGrad.addColorStop(0,   'rgba(255,220,80,0.95)');
      capGrad.addColorStop(0.3, 'rgba(220,120,30,0.9)');
      capGrad.addColorStop(0.65,'rgba(160,60,10,0.85)');
      capGrad.addColorStop(1,   'rgba(80,30,5,0.6)');
      ctx.fillStyle = capGrad;
      ctx.beginPath();
      ctx.ellipse(cx, stemTopY, capRx, capRy, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cap outline
      ctx.strokeStyle = 'rgba(255,150,30,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, stemTopY, capRx, capRy, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Underbelly curl
      const curlRx = capRx * 0.75;
      const curlRy = capRy * 0.5;
      const curlGrad = ctx.createRadialGradient(cx, stemTopY + capRy * 0.3, 0, cx, stemTopY + capRy, curlRx);
      curlGrad.addColorStop(0,   'rgba(180,100,20,0.7)');
      curlGrad.addColorStop(1,   'rgba(80,30,5,0.3)');
      ctx.fillStyle = curlGrad;
      ctx.beginPath();
      ctx.ellipse(cx, stemTopY + capRy * 0.3, curlRx, curlRy, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ground shockwave ring
      if (progress > 0.3) {
        const ringR  = Math.min(w * 0.45, w * 0.45 * (progress - 0.3) / 0.7);
        const ringAlpha = Math.max(0, 0.6 - progress * 0.5);
        ctx.strokeStyle = `rgba(255,200,80,${ringAlpha})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(cx, baseY, ringR, ringR * 0.15, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    function drawScreenFlash(intensity) {
      if (intensity <= 0) return;
      ctx.fillStyle = `rgba(255,180,50,${intensity * 0.55})`;
      ctx.fillRect(0, 0, W(), H());
    }

    function loop(ts) {
      const elapsed = ts - startTime;
      const w = W(), h = H();
      ctx.clearRect(0, 0, w, h);

      const cloudCx = w / 2;
      const cloudBaseY = h * 0.88;

      if (elapsed < BLAST_AT) {
        // Growing phase
        const progress = elapsed / BLAST_AT;
        drawMushroom(cloudCx, cloudBaseY, progress);
      }

      if (elapsed >= BLAST_AT) {
        if (!blasted) {
          blasted = true;
          clearInterval(shakeInterval);
          body.style.transform = '';
          wordLabelEls.forEach(el => el.classList.add('exploding'));
        }

        const postBlast = elapsed - BLAST_AT;
        const dissipate = Math.min(postBlast / (TOTAL - BLAST_AT), 1);

        // Draw cloud fading out
        ctx.globalAlpha = Math.max(0, 1 - dissipate * 0.8);
        drawMushroom(cloudCx, cloudBaseY, 1 + dissipate * 0.15);
        ctx.globalAlpha = 1;

        // Screen flash at the moment of blast
        const flashAge = postBlast / 1000;
        if (flashAge < 0.6) {
          drawScreenFlash(1 - flashAge / 0.6);
        }
      }

      if (elapsed < TOTAL) {
        requestAnimationFrame(loop);
      } else {
        clearInterval(shakeInterval);
        body.style.transform = '';
        ctx.clearRect(0, 0, w, h);
        resolve();
      }
    }

    requestAnimationFrame(loop);
  });
}
