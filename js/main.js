import { loadProgress } from './state.js';
import { startRound, setSoundsData } from './round.js';
import { unlockAudio, preloadSounds } from './audio.js';
import { resizeCanvas } from './canvas.js';

async function init() {
  loadProgress();

  // Wait for the Skolacek cursive font before first render
  await document.fonts.ready;

  // Canvas setup
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));

  // Audio unlock on first user interaction (browser requirement)
  let soundsData = {};
  async function handleFirstInteraction() {
    await unlockAudio();
    try {
      const resp = await fetch('sounds.json');
      soundsData = await resp.json();
      setSoundsData(soundsData);
      await preloadSounds(soundsData);
    } catch (err) {
      console.warn('[main] Could not load sounds.json:', err);
    }
    // Debug panel needs soundsData — init it here if active
    if (debugActive) initDebugIfReady(soundsData);
  }
  document.addEventListener('touchstart', handleFirstInteraction, { once: true, passive: true });
  document.addEventListener('click',      handleFirstInteraction, { once: true });

  // Debug mode — ?debug=1
  const debugActive = new URLSearchParams(location.search).has('debug');
  let debugInited   = false;
  async function initDebugIfReady(sd) {
    if (debugInited) return;
    debugInited = true;
    const { initDebugPanel } = await import('./debug.js');
    initDebugPanel(sd);
  }
  // Show panel immediately in debug mode (sounds load after first touch)
  if (debugActive) {
    const { initDebugPanel } = await import('./debug.js');
    initDebugPanel({});  // will be re-initialized with real soundsData on first touch
  }

  // Service Worker registration
  if ('serviceWorker' in navigator) {
    registerSW();
  }

  // Start first round
  startRound();
}

function registerSW() {
  navigator.serviceWorker.register('./sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateToast(newWorker);
        }
      });
    });
  }).catch(err => console.warn('[SW] Registration failed:', err));

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

function showUpdateToast(worker) {
  const toast = document.getElementById('toast-update');
  const btn   = document.getElementById('toast-reload-btn');
  toast.classList.remove('hidden');
  btn.addEventListener('click', () => {
    worker.postMessage({ type: 'SKIP_WAITING' });
  }, { once: true });
}

init();
