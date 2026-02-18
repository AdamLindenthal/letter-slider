const canvas = document.getElementById('anim-canvas');
export const ctx = canvas.getContext('2d');

let dpr = 1;

export function resizeCanvas() {
  dpr = window.devicePixelRatio || 1;
  canvas.width  = window.innerWidth  * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width  = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  // setTransform resets + applies scale in one call (avoids accumulation on repeated calls)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function clearCanvas() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

export function showCanvas() {
  canvas.style.opacity = '1';
}

export function hideCanvas() {
  canvas.style.opacity = '0';
  clearCanvas();
}

/** Fade canvas opacity to 0 over `ms` milliseconds. Returns a Promise. */
export function fadeOutCanvas(ms = 800) {
  return new Promise(resolve => {
    canvas.style.transition = `opacity ${ms}ms ease`;
    canvas.style.opacity = '0';
    setTimeout(() => {
      clearCanvas();
      canvas.style.transition = '';
      canvas.style.opacity = '1';
      resolve();
    }, ms);
  });
}

/** w/h of logical (CSS) canvas size */
export const W = () => window.innerWidth;
export const H = () => window.innerHeight;
