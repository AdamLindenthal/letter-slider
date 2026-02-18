let audioCtx = null;
const bufferCache = new Map();
let audioReady = false;

/** Call on first user gesture to unlock the AudioContext. */
export async function unlockAudio() {
  if (audioReady) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    audioReady = true;
  } catch (err) {
    console.warn('[audio] AudioContext unavailable:', err);
  }
}

/** Preload all sounds declared in soundsData object. */
export async function preloadSounds(soundsData) {
  if (!audioCtx) return;
  const urls = new Set();
  for (const cues of Object.values(soundsData)) {
    for (const cue of Object.values(cues)) {
      if (cue.src) urls.add(cue.src);
    }
  }
  await Promise.allSettled([...urls].map(url => loadSound(url)));
}

/** Load and decode one audio file; result is cached. */
export async function loadSound(url) {
  if (!audioCtx) return null;
  if (bufferCache.has(url)) return bufferCache.get(url);
  try {
    const resp = await fetch(url);
    const data = await resp.arrayBuffer();
    const buffer = await audioCtx.decodeAudioData(data);
    bufferCache.set(url, buffer);
    return buffer;
  } catch (err) {
    console.warn('[audio] Failed to load', url, err);
    return null;
  }
}

/**
 * Play a sound buffer.
 * @param {string} url
 * @param {{ volume?: number, delayMs?: number }} opts
 */
export function playSound(url, { volume = 1, delayMs = 0 } = {}) {
  if (!audioCtx || !audioReady) return;
  const buffer = bufferCache.get(url);
  if (!buffer) return;

  const gain = audioCtx.createGain();
  gain.gain.value = Math.max(0, Math.min(1, volume));
  gain.connect(audioCtx.destination);

  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  src.connect(gain);
  src.start(audioCtx.currentTime + delayMs / 1000);
}

/** Schedule all sound cues from a sounds.json animation entry. */
export function scheduleSounds(animCues) {
  if (!animCues) return;
  for (const cue of Object.values(animCues)) {
    if (cue?.src) {
      playSound(cue.src, { volume: cue.volume ?? 1, delayMs: cue.startMs ?? 0 });
    }
  }
}

/**
 * Soft "thud" when a letter card is dropped into a tray.
 * Generated synthetically — no external file needed.
 */
export function playDropSound() {
  if (!audioCtx || !audioReady) return;
  try {
    const t = audioCtx.currentTime;
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.09);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.start(t);
    osc.stop(t + 0.15);
  } catch (_) {}
}

/**
 * Higher-pitched "tick" when a tray card is removed.
 */
export function playRemoveSound() {
  if (!audioCtx || !audioReady) return;
  try {
    const t = audioCtx.currentTime;
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.07);
    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    osc.start(t);
    osc.stop(t + 0.1);
  } catch (_) {}
}
