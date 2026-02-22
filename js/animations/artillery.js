import { ctx, W, H } from '../canvas.js';

/**
 * Artillery animation:
 *   0–2200ms   Two soldiers push a wheeled artillery gun in from the right
 *   2200–3200ms Soldiers step to operating positions; barrel slowly aims up
 *   3200ms     Fire! Muzzle flash, shell arcs toward word labels
 *   3700ms     Impact → .exploding on word labels
 *   3700–5600ms Explosion fades; soldiers raise arms in celebration
 *   5600ms     Done
 */
export function artilleryAnimation(wordLabelEls) {
  const TOTAL     = 5800;
  const STOP_AT   = 2200;
  const AIM_END   = 3200;
  const FIRE_AT   = 3300;
  const IMPACT_AT = 3800;

  return new Promise(resolve => {
    const startTime = performance.now();
    let fired    = false;
    let impacted = false;

    const rects   = wordLabelEls.map(el => el.getBoundingClientRect());
    const targetX = rects.reduce((s, r) => s + r.left + r.width  / 2, 0) / rects.length;
    const targetY = rects.reduce((s, r) => s + r.top  + r.height / 2, 0) / rects.length;

    const w = W(), h = H();
    const sc       = Math.min(1, w / 900);            // uniform scale
    const wheelR   = Math.round(28 * sc);
    const groundY  = Math.round(h * 0.84);
    const axleY    = groundY - wheelR;                // wheels rest on ground
    const stopX    = Math.round(w * 0.62);
    const barrelLen = Math.round(88 * sc);
    const trailLen  = Math.round(72 * sc);

    // Barrel pivot position (fixed once cannon stops)
    const pivotX   = stopX;
    const pivotY   = axleY - Math.round(34 * sc);
    const aimAngle = Math.atan2(pivotY - targetY, pivotX - targetX);

    // Shell state
    const shell = { startX: 0, startY: 0, active: false, done: false, fireTime: 0 };

    // ── Drawing helpers ──────────────────────────────────────────

    function drawSpokedWheel(cx, cy, rot) {
      const r = wheelR;
      // Metal tyre
      ctx.strokeStyle = '#1e1208';
      ctx.lineWidth = Math.max(5, r * 0.17);
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      // Wood felloe
      ctx.strokeStyle = '#5a4018';
      ctx.lineWidth = Math.max(2, r * 0.07);
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.84, 0, Math.PI * 2); ctx.stroke();
      // Spokes (8)
      ctx.strokeStyle = '#6a5020';
      ctx.lineWidth = Math.max(2, r * 0.09);
      ctx.lineCap = 'round';
      for (let i = 0; i < 8; i++) {
        const a = rot + (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r * 0.17, cy + Math.sin(a) * r * 0.17);
        ctx.lineTo(cx + Math.cos(a) * r * 0.80, cy + Math.sin(a) * r * 0.80);
        ctx.stroke();
      }
      // Hub
      ctx.fillStyle = '#2e1a08';
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.17, 0, Math.PI * 2); ctx.fill();
    }

    function drawCannon(ax, ay, barrelAngle, wheelRot) {
      const s = sc;
      // Trail legs (extend right behind cannon)
      ctx.strokeStyle = '#5a4820';
      ctx.lineWidth = Math.max(5, 7 * s);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ax - 8 * s, ay + 4 * s);
      ctx.lineTo(ax + trailLen, ay + 18 * s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ax + 8 * s, ay + 2 * s);
      ctx.lineTo(ax + trailLen, ay + 6 * s);
      ctx.stroke();
      // Cross-brace on trail
      ctx.lineWidth = Math.max(3, 4 * s);
      ctx.beginPath();
      ctx.moveTo(ax + trailLen * 0.55, ay + 8 * s);
      ctx.lineTo(ax + trailLen * 0.55, ay + 16 * s);
      ctx.stroke();

      // Axle
      ctx.strokeStyle = '#3a2808';
      ctx.lineWidth = Math.max(6, 9 * s);
      ctx.beginPath();
      ctx.moveTo(ax - wheelR - 8 * s, ay);
      ctx.lineTo(ax + wheelR + 8 * s, ay);
      ctx.stroke();

      // Wheels
      drawSpokedWheel(ax - wheelR - 4 * s, ay, wheelRot);
      drawSpokedWheel(ax + wheelR + 4 * s, ay, -wheelRot);

      // Carriage neck
      ctx.fillStyle = '#7a6028';
      ctx.beginPath();
      ctx.moveTo(ax - 16 * s, ay);
      ctx.lineTo(ax + 16 * s, ay);
      ctx.lineTo(ax + 10 * s, ay - 33 * s);
      ctx.lineTo(ax - 10 * s, ay - 33 * s);
      ctx.closePath();
      ctx.fill();

      // Barrel assembly pivots from top of neck
      ctx.save();
      ctx.translate(ax, ay - 33 * s);
      ctx.rotate(barrelAngle);

      // Recoil spring housing
      ctx.fillStyle = '#5a5028';
      ctx.fillRect(-barrelLen * 0.35, -9 * s, barrelLen * 0.35, 18 * s);

      // Barrel tube
      ctx.fillStyle = '#5a5828';
      ctx.fillRect(-barrelLen, -6 * s, barrelLen, 12 * s);
      ctx.fillStyle = 'rgba(255,255,200,0.09)';
      ctx.fillRect(-barrelLen, -6 * s, barrelLen, 4 * s);

      // Muzzle brake (notched)
      ctx.fillStyle = '#3a3820';
      ctx.fillRect(-barrelLen - 8 * s, -10 * s, 13 * s, 20 * s);
      ctx.fillStyle = '#5a5828';
      ctx.fillRect(-barrelLen - 4 * s, -10 * s, 4 * s, 6 * s);
      ctx.fillRect(-barrelLen - 4 * s,   4 * s, 4 * s, 6 * s);

      // Shield plate
      ctx.fillStyle = '#8a7830';
      ctx.beginPath();
      ctx.moveTo(-6 * s, -28 * s);
      ctx.lineTo(-6 * s,  18 * s);
      ctx.lineTo(18 * s,  16 * s);
      ctx.lineTo(18 * s, -26 * s);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#6a5820';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Sight slot
      ctx.fillStyle = '#3a2a10';
      ctx.fillRect(6 * s, -18 * s, 8 * s, 6 * s);

      // Breech block
      ctx.fillStyle = '#6a5820';
      ctx.beginPath();
      ctx.arc(16 * s, 0, 15 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4a3810';
      ctx.beginPath();
      ctx.arc(16 * s, 0, 7 * s, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    function drawSoldier(sx, sy, lean, armPhase, legPhase) {
      // lean   : forward tilt (radians)
      // armPhase: 0 = arms extended pushing, 1 = arms raised celebrating
      // legPhase: walking cycle (radians)
      ctx.save();
      ctx.translate(sx, sy);
      const s = sc;
      const bodyH = 22 * s;
      const legH  = 20 * s;
      const headR =  7 * s;
      const swing = Math.sin(legPhase) * 0.28;

      // Legs
      ctx.strokeStyle = '#3a3f20';
      ctx.lineWidth = Math.max(3, 4 * s);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-swing * legH, legH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo( swing * legH, legH);
      ctx.stroke();

      // Torso (leans forward)
      ctx.save();
      ctx.rotate(-lean);

      ctx.fillStyle = '#4a5828';
      ctx.fillRect(-6 * s, -bodyH, 12 * s, bodyH);

      // Arms
      ctx.strokeStyle = '#4a5828';
      ctx.lineWidth = Math.max(3, 4 * s);
      if (armPhase < 0.5) {
        // Pushing: arms extend left toward trail
        const ext = 1 - armPhase * 2;
        const reach = 20 * s * ext;
        ctx.beginPath();
        ctx.moveTo(-5 * s, -bodyH * 0.72);
        ctx.lineTo(-5 * s - reach, -bodyH * 0.72 + 5 * s * (1 - ext));
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo( 5 * s, -bodyH * 0.72);
        ctx.lineTo(-5 * s - reach, -bodyH * 0.72 + 8 * s * (1 - ext));
        ctx.stroke();
      } else {
        // Celebrating: arms raise upward
        const raise = (armPhase - 0.5) * 2;
        ctx.beginPath();
        ctx.moveTo(-5 * s, -bodyH * 0.8);
        ctx.lineTo(-10 * s - 8 * s * raise, -bodyH * 0.8 - 18 * s * raise);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo( 5 * s, -bodyH * 0.8);
        ctx.lineTo( 10 * s + 8 * s * raise, -bodyH * 0.8 - 18 * s * raise);
        ctx.stroke();
      }

      // Head (skin)
      ctx.fillStyle = '#c09860';
      ctx.beginPath();
      ctx.arc(0, -bodyH - headR, headR, 0, Math.PI * 2);
      ctx.fill();

      // Helmet
      ctx.fillStyle = '#3a4820';
      ctx.beginPath();
      ctx.arc(0, -bodyH - headR, headR + 1, Math.PI, Math.PI * 2);
      ctx.fill();
      // Brim
      ctx.strokeStyle = '#3a4820';
      ctx.lineWidth = Math.max(2, 3 * s);
      ctx.beginPath();
      ctx.moveTo(-(headR + 4) * s, -bodyH - headR * 0.25);
      ctx.lineTo( (headR + 4) * s, -bodyH - headR * 0.25);
      ctx.stroke();

      ctx.restore(); // undo lean
      ctx.restore(); // undo translate
    }

    function drawMuzzleFlash(mx, my, angle, age) {
      const alpha = Math.max(0, 1 - age * 2.5);
      if (alpha <= 0) return;
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(angle + Math.PI);
      ctx.globalAlpha = alpha;
      const r = 38 * sc * (1 - age * 0.4);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0,   'rgba(255,255,220,1)');
      g.addColorStop(0.35,'rgba(255,200,40,0.85)');
      g.addColorStop(1,   'rgba(255,80,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      // Star rays
      ctx.strokeStyle = `rgba(255,220,60,${alpha * 0.65})`;
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const len = (22 + (i % 3) * 14) * sc * (1 - age * 0.6);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    function drawShell(sx, sy) {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.fillStyle = '#d4a030';
      ctx.beginPath(); ctx.ellipse(0, 0, 15 * sc, 6 * sc, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f0c040';
      ctx.beginPath(); ctx.ellipse(-4 * sc, 0, 5 * sc, 3 * sc, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    function drawExplosion(ex, ey, progress) {
      const r = 12 + progress * 100;
      const a = Math.max(0, 1 - progress * 0.9);
      const g = ctx.createRadialGradient(ex, ey, 0, ex, ey, r);
      g.addColorStop(0,    `rgba(255,255,200,${a})`);
      g.addColorStop(0.3,  `rgba(255,170,20,${a * 0.88})`);
      g.addColorStop(0.7,  `rgba(220,50,10,${a * 0.6})`);
      g.addColorStop(1,    'rgba(80,20,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2); ctx.fill();
    }

    // ── Main loop ────────────────────────────────────────────────

    function loop(ts) {
      const elapsed = ts - startTime;
      ctx.clearRect(0, 0, W(), H());

      // Cannon x position
      let axleX;
      if (elapsed < STOP_AT) {
        const t    = elapsed / STOP_AT;
        const ease = 1 - Math.pow(1 - t, 3);
        axleX = W() + 120 + (stopX - W() - 120) * ease;
      } else {
        axleX = stopX;
      }

      // Wheel rotation (distance-based)
      const distTravelled = (W() + 120 - axleX);
      const wheelRot = distTravelled / wheelR;

      // Barrel angle
      let barrelAngle = 0;
      if (elapsed >= STOP_AT && elapsed < AIM_END) {
        const t = (elapsed - STOP_AT) / (AIM_END - STOP_AT);
        barrelAngle = aimAngle * (1 - Math.pow(1 - t, 2));
      } else if (elapsed >= AIM_END) {
        barrelAngle = aimAngle;
      }

      drawCannon(axleX, axleY, barrelAngle, wheelRot);

      // Soldiers
      const trailHandleX = axleX + trailLen + 12 * sc;
      const trailHandleY = axleY - 26 * sc;
      const standX1 = stopX + 55 * sc;
      const standX2 = stopX + 84 * sc;
      const standY  = axleY - 26 * sc;

      if (elapsed < STOP_AT) {
        const legPhase = elapsed * 0.011;
        drawSoldier(trailHandleX,           trailHandleY, 0.40, 0.0, legPhase);
        drawSoldier(trailHandleX + 28 * sc, trailHandleY, 0.38, 0.0, legPhase + Math.PI);
      } else {
        const tMove = Math.min((elapsed - STOP_AT) / 500, 1);
        const ease  = 1 - Math.pow(1 - tMove, 2);
        const sx1 = trailHandleX           + (standX1 - trailHandleX)           * ease;
        const sx2 = (trailHandleX + 28 * sc) + (standX2 - (trailHandleX + 28 * sc)) * ease;

        let armPhase = tMove * 0.5;
        if (elapsed >= IMPACT_AT + 400) {
          const ct = Math.min((elapsed - IMPACT_AT - 400) / 700, 1);
          armPhase = 0.5 + ct * 0.5;
        }
        drawSoldier(sx1, standY, 0.08 * (1 - tMove), armPhase,       0);
        drawSoldier(sx2, standY, 0.08 * (1 - tMove), armPhase * 0.9, 0);
      }

      // Muzzle flash
      if (elapsed >= FIRE_AT) {
        const flashAge = (elapsed - FIRE_AT) / 480;
        const muzzleX = pivotX + Math.cos(aimAngle) * (-barrelLen);
        const muzzleY = pivotY + Math.sin(aimAngle) * (-barrelLen);
        drawMuzzleFlash(muzzleX, muzzleY, aimAngle, flashAge);
      }

      // Shell in flight
      if (elapsed >= FIRE_AT && !fired) {
        fired = true;
        shell.startX = pivotX + Math.cos(aimAngle) * (-barrelLen);
        shell.startY = pivotY + Math.sin(aimAngle) * (-barrelLen);
        shell.active = true;
        shell.fireTime = elapsed;
      }
      if (shell.active && !shell.done) {
        const dur = IMPACT_AT - FIRE_AT;
        const t   = Math.min((elapsed - shell.fireTime) / dur, 1);
        const sx  = shell.startX + (targetX - shell.startX) * t;
        const sy  = shell.startY + (targetY - shell.startY) * t - Math.sin(t * Math.PI) * 55;
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
