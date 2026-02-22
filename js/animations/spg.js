import { ctx, W, H } from '../canvas.js';

/**
 * SPG (Self-Propelled Howitzer on a wheeled vehicle) animation:
 *   0–1900ms   Military truck with roof-mounted howitzer drives in from right
 *   1900–3000ms Vehicle brakes to a stop; howitzer barrel slowly elevates to aim
 *   3000ms     Fire! Large muzzle blast, shell arcs up
 *   3500ms     Impact → .exploding on word labels
 *   3500–5400ms Explosion fades; vehicle drives away to the left
 *   5400ms     Done
 */
export function spgAnimation(wordLabelEls) {
  const TOTAL     = 5600;
  const STOP_AT   = 1900;
  const AIM_END   = 3000;
  const FIRE_AT   = 3050;
  const IMPACT_AT = 3550;
  const EXIT_AT   = 3700;

  return new Promise(resolve => {
    const startTime = performance.now();
    let fired    = false;
    let impacted = false;

    const rects   = wordLabelEls.map(el => el.getBoundingClientRect());
    const targetX = rects.reduce((s, r) => s + r.left + r.width  / 2, 0) / rects.length;
    const targetY = rects.reduce((s, r) => s + r.top  + r.height / 2, 0) / rects.length;

    const w = W(), h = H();
    const sc      = Math.min(1, w / 900);
    const groundY = Math.round(h * 0.84);
    const wheelR  = Math.round(22 * sc);
    const bodyH   = Math.round(38 * sc);

    // Vehicle stop position (front of vehicle = left edge)
    const stopFrontX = Math.round(w * 0.55);

    // Vehicle dimensions (all relative to front-bottom of vehicle)
    const totalLen = Math.round(200 * sc);
    const cabLen   = Math.round(60 * sc);

    // Howitzer mount sits on top of chassis, near front
    const mountOffX = Math.round(30 * sc);  // from front of vehicle
    const mountOffY = bodyH + Math.round(10 * sc);  // above chassis top
    const barrelLen = Math.round(108 * sc);

    // When vehicle is stopped, mount position in world space
    const mountX   = stopFrontX + mountOffX;
    const mountY   = groundY - wheelR - mountOffY;
    const aimAngle = Math.atan2(mountY - targetY, mountX - targetX);

    const shell = { startX: 0, startY: 0, active: false, done: false, fireTime: 0 };

    // ── Drawing helpers ──────────────────────────────────────────

    function drawTruckWheel(cx, cy, rot) {
      const r = wheelR;
      // Tyre
      ctx.fillStyle = '#181410';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      // Wheel arch highlight
      ctx.strokeStyle = '#2a2218';
      ctx.lineWidth = Math.max(2, r * 0.12);
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      // Rim
      ctx.fillStyle = '#7a7050';
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.58, 0, Math.PI * 2); ctx.fill();
      // Lug nuts
      ctx.fillStyle = '#4a4830';
      for (let i = 0; i < 5; i++) {
        const a = rot + (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * r * 0.34, cy + Math.sin(a) * r * 0.34,
                Math.max(2, r * 0.11), 0, Math.PI * 2);
        ctx.fill();
      }
      // Centre hub
      ctx.fillStyle = '#2a2818';
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.13, 0, Math.PI * 2); ctx.fill();
    }

    function drawSPG(frontX, barrelAngle, wheelRot) {
      const s = sc;
      const bY = groundY - wheelR;  // chassis bottom (= axle height)

      ctx.save();
      ctx.translate(frontX, bY);

      // ── Chassis/bed ──────────────────────────────────────────
      ctx.fillStyle = '#5e6638';
      ctx.fillRect(0, -bodyH, totalLen, bodyH);

      // Chassis highlight
      ctx.fillStyle = 'rgba(255,255,200,0.07)';
      ctx.fillRect(0, -bodyH, totalLen, bodyH * 0.28);

      // Chassis panel lines
      ctx.strokeStyle = '#3a4020';
      ctx.lineWidth = 1.5 * s;
      ctx.beginPath();
      ctx.moveTo(totalLen - cabLen, -bodyH);
      ctx.lineTo(totalLen - cabLen, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(totalLen * 0.45, -bodyH * 0.5);
      ctx.lineTo(totalLen * 0.45, 0);
      ctx.stroke();

      // ── Cab (rear of vehicle — opposite to gun) ──────────────
      const cabH = Math.round(52 * s);
      ctx.fillStyle = '#4e5830';
      ctx.beginPath();
      ctx.moveTo(totalLen - cabLen,      -bodyH);
      ctx.lineTo(totalLen - cabLen + 6 * s, -bodyH - cabH);
      ctx.lineTo(totalLen - 6 * s,          -bodyH - cabH * 0.82);
      ctx.lineTo(totalLen,               -bodyH);
      ctx.closePath();
      ctx.fill();

      // Windshield
      ctx.fillStyle = 'rgba(100,185,230,0.55)';
      ctx.beginPath();
      ctx.moveTo(totalLen - cabLen + 10 * s, -bodyH - 4 * s);
      ctx.lineTo(totalLen - cabLen + 14 * s, -bodyH - cabH * 0.93);
      ctx.lineTo(totalLen - cabLen + 42 * s, -bodyH - cabH * 0.93);
      ctx.lineTo(totalLen - cabLen + 38 * s, -bodyH - 4 * s);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#2a3010';
      ctx.lineWidth = 1.5 * s;
      ctx.stroke();

      // Cab rear window
      ctx.fillStyle = 'rgba(80,150,200,0.45)';
      ctx.fillRect(totalLen - 18 * s, -bodyH - cabH * 0.7, 10 * s, cabH * 0.42);
      ctx.strokeStyle = '#2a3010';
      ctx.lineWidth = 1 * s;
      ctx.strokeRect(totalLen - 18 * s, -bodyH - cabH * 0.7, 10 * s, cabH * 0.42);

      // Headlight (front of vehicle = left, where gun is)
      ctx.fillStyle = '#e8e060';
      ctx.fillRect(-4 * s, -bodyH + 5 * s, 6 * s, 10 * s);
      ctx.strokeStyle = '#b0a840';
      ctx.lineWidth = 1 * s;
      ctx.strokeRect(-4 * s, -bodyH + 5 * s, 6 * s, 10 * s);

      // ── Wheels (4) ───────────────────────────────────────────
      drawTruckWheel(wheelR * 1.1,       0, wheelRot);
      drawTruckWheel(totalLen * 0.38,    0, wheelRot);
      drawTruckWheel(totalLen * 0.62,    0, wheelRot);
      drawTruckWheel(totalLen - wheelR * 1.1, 0, wheelRot);

      // ── Howitzer mount ───────────────────────────────────────
      const mx = mountOffX;
      const my = -bodyH - Math.round(10 * s);

      // Gun platform / ring
      ctx.fillStyle = '#3e4220';
      ctx.beginPath(); ctx.arc(mx, my, 18 * s, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#5a5c30';
      ctx.lineWidth = 2 * s;
      ctx.stroke();

      // Barrel assembly
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(barrelAngle);

      // Support arm / elevation bracket
      ctx.strokeStyle = '#4a4820';
      ctx.lineWidth = 7 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-barrelLen * 0.55, 16 * s);
      ctx.stroke();

      // Barrel tube
      ctx.fillStyle = '#585828';
      ctx.fillRect(-barrelLen, -7 * s, barrelLen, 14 * s);
      ctx.fillStyle = 'rgba(255,255,200,0.08)';
      ctx.fillRect(-barrelLen, -7 * s, barrelLen, 5 * s);

      // Muzzle brake (slotted)
      ctx.fillStyle = '#383820';
      ctx.fillRect(-barrelLen - 10 * s, -11 * s, 16 * s, 22 * s);
      ctx.fillStyle = '#585828';
      ctx.fillRect(-barrelLen - 6 * s, -11 * s, 4 * s,  8 * s);
      ctx.fillRect(-barrelLen - 6 * s,   3 * s, 4 * s,  8 * s);

      // Breech
      ctx.fillStyle = '#686838';
      ctx.beginPath();
      ctx.arc(16 * s, 0, 16 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#484820';
      ctx.beginPath();
      ctx.arc(16 * s, 0, 8 * s, 0, Math.PI * 2);
      ctx.fill();
      // Elevation handle
      ctx.strokeStyle = '#585838';
      ctx.lineWidth = 4 * s;
      ctx.beginPath();
      ctx.moveTo(16 * s, 12 * s);
      ctx.lineTo(22 * s, 28 * s);
      ctx.stroke();

      ctx.restore(); // barrel
      ctx.restore(); // vehicle translate
    }

    function drawMuzzleFlash(mx, my, angle, age) {
      const alpha = Math.max(0, 1 - age * 2.2);
      if (alpha <= 0) return;
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(angle + Math.PI);
      ctx.globalAlpha = alpha;
      const r = 48 * sc * (1 - age * 0.35);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0,    'rgba(255,255,230,1)');
      g.addColorStop(0.3,  'rgba(255,210,50,0.9)');
      g.addColorStop(0.75, 'rgba(255,90,10,0.5)');
      g.addColorStop(1,    'rgba(200,50,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      // Rays
      ctx.strokeStyle = `rgba(255,230,80,${alpha * 0.7})`;
      ctx.lineWidth = 3;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const len = (28 + (i % 3) * 16) * sc * (1 - age * 0.55);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
        ctx.stroke();
      }
      // Smoke puff
      if (age > 0.1) {
        ctx.globalAlpha = alpha * 0.35;
        ctx.fillStyle = '#606060';
        ctx.beginPath();
        ctx.arc(-20 * sc, -15 * sc, 18 * sc * age, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    function drawShell(sx, sy) {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.fillStyle = '#d4a030';
      ctx.beginPath(); ctx.ellipse(0, 0, 16 * sc, 7 * sc, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f0c848';
      ctx.beginPath(); ctx.ellipse(-4 * sc, 0, 6 * sc, 4 * sc, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    function drawExplosion(ex, ey, progress) {
      const r = 14 + progress * 110;
      const a = Math.max(0, 1 - progress * 0.88);
      const g = ctx.createRadialGradient(ex, ey, 0, ex, ey, r);
      g.addColorStop(0,   `rgba(255,255,200,${a})`);
      g.addColorStop(0.3, `rgba(255,175,20,${a * 0.9})`);
      g.addColorStop(0.7, `rgba(220,50,10,${a * 0.6})`);
      g.addColorStop(1,   'rgba(80,20,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2); ctx.fill();
    }

    // ── Main loop ────────────────────────────────────────────────

    function loop(ts) {
      const elapsed = ts - startTime;
      ctx.clearRect(0, 0, W(), H());

      // Vehicle front x
      let frontX;
      if (elapsed < STOP_AT) {
        // Drive in from right, decelerate
        const t    = elapsed / STOP_AT;
        const ease = 1 - Math.pow(1 - t, 3);
        frontX = W() + 60 + (stopFrontX - W() - 60) * ease;
      } else if (elapsed < EXIT_AT) {
        frontX = stopFrontX;
      } else {
        // Drive out to the left
        const t    = (elapsed - EXIT_AT) / (TOTAL - EXIT_AT);
        const ease = t * t;
        frontX = stopFrontX - ease * (stopFrontX + totalLen + 80);
      }

      // Wheel rotation (distance-based)
      let distTravelled;
      if (elapsed < STOP_AT) {
        distTravelled = (W() + 60) - frontX;
      } else if (elapsed < EXIT_AT) {
        distTravelled = (W() + 60) - stopFrontX; // stopped
      } else {
        const tExit = (elapsed - EXIT_AT) / (TOTAL - EXIT_AT);
        distTravelled = ((W() + 60) - stopFrontX) + (stopFrontX - frontX);
      }
      const wheelRot = distTravelled / wheelR;

      // Barrel angle (0 = horizontal/left, sweeps up to aimAngle)
      let barrelAngle = 0;
      if (elapsed >= STOP_AT && elapsed < AIM_END) {
        const t = (elapsed - STOP_AT) / (AIM_END - STOP_AT);
        barrelAngle = aimAngle * (1 - Math.pow(1 - t, 2));
      } else if (elapsed >= AIM_END) {
        barrelAngle = aimAngle;
      }

      drawSPG(frontX, barrelAngle, wheelRot);

      // Muzzle flash
      if (elapsed >= FIRE_AT) {
        const curMountX = frontX + mountOffX;
        const flashAge  = (elapsed - FIRE_AT) / 520;
        const muzzleX   = curMountX + Math.cos(aimAngle) * (-barrelLen);
        const muzzleY   = mountY + Math.sin(aimAngle) * (-barrelLen);
        drawMuzzleFlash(muzzleX, muzzleY, aimAngle, flashAge);
      }

      // Shell in flight
      if (elapsed >= FIRE_AT && !fired) {
        fired = true;
        shell.startX = mountX + Math.cos(aimAngle) * (-barrelLen);
        shell.startY = mountY + Math.sin(aimAngle) * (-barrelLen);
        shell.active = true;
        shell.fireTime = elapsed;
      }
      if (shell.active && !shell.done) {
        const dur = IMPACT_AT - FIRE_AT;
        const t   = Math.min((elapsed - shell.fireTime) / dur, 1);
        const sx  = shell.startX + (targetX - shell.startX) * t;
        const sy  = shell.startY + (targetY - shell.startY) * t - Math.sin(t * Math.PI) * 60;
        drawShell(sx, sy);
        if (t >= 1) shell.done = true;
      }

      // Impact
      if (elapsed >= IMPACT_AT && !impacted) {
        impacted = true;
        wordLabelEls.forEach(el => el.classList.add('exploding'));
      }
      if (elapsed >= IMPACT_AT) {
        const prog = Math.min((elapsed - IMPACT_AT) / 1100, 1);
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
