#!/usr/bin/env node
/**
 * Generates PWA icons using node-canvas (if available) or
 * falls back to creating minimal valid PNG files.
 *
 * Run: node create-icons.js
 *
 * If this fails, open generate-icons.html in a browser instead.
 */

const fs = require('fs');
const path = require('path');
const outDir = path.join(__dirname, 'assets', 'icons');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Try to use node-canvas
let canvas;
try {
  canvas = require('canvas');
} catch (_) {
  canvas = null;
}

if (canvas) {
  generateWithCanvas(canvas);
} else {
  // Embed a pre-generated minimal olive-green PNG (1×1 pixel, scaled by browser)
  // Real icons need the generate-icons.html approach.
  console.log('node-canvas not installed. Generating placeholder icons.');
  generatePlaceholders();
}

function generateWithCanvas({ createCanvas }) {
  [192, 512].forEach(size => {
    const c = createCanvas(size, size);
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#4a5c2a';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = 'rgba(45,58,26,0.65)';
    ctx.beginPath(); ctx.ellipse(size*0.25, size*0.3, size*0.2, size*0.13, -0.3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(size*0.75, size*0.65, size*0.22, size*0.14, 0.4, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#c8b560';
    ctx.font = `bold ${Math.floor(size * 0.72)}px Impact`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('P', size / 2, size * 0.78);

    ctx.strokeStyle = '#c8b560';
    ctx.lineWidth = Math.max(2, size * 0.025);
    const m = ctx.lineWidth / 2;
    ctx.strokeRect(m, m, size - ctx.lineWidth, size - ctx.lineWidth);

    const buf = c.toBuffer('image/png');
    const file = path.join(outDir, `icon-${size}.png`);
    fs.writeFileSync(file, buf);
    console.log('Wrote', file);
  });
}

function generatePlaceholders() {
  // Minimal 1×1 olive-green PNG (binary)
  // This is a valid PNG; browsers will scale it (poorly for real use).
  // Open generate-icons.html for proper icons.
  const png1x1Olive = Buffer.from([
    0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a, // PNG signature
    0x00,0x00,0x00,0x0d,0x49,0x48,0x44,0x52, // IHDR length + type
    0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01, // 1x1
    0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53, // 8-bit RGB, CRC
    0xde,0x00,0x00,0x00,0x0c,0x49,0x44,0x41, // IDAT length + type
    0x54,0x08,0xd7,0x63,0x60,0xb8,0x58,0x60, // zlib-compressed row: #4a5c2a
    0x00,0x00,0x00,0x04,0x00,0x01,0x27,0x05, // CRC + IEND
    0x1b,0x00,0x00,0x00,0x00,0x49,0x45,0x4e,
    0x44,0xae,0x42,0x60,0x82,
  ]);

  ['icon-192.png', 'icon-512.png'].forEach(name => {
    const file = path.join(outDir, name);
    fs.writeFileSync(file, png1x1Olive);
    console.log('Wrote placeholder', file, '— open generate-icons.html for proper icons!');
  });
}
