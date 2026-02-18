import { CONFIG } from './config.js';

export const state = {
  round: 1,
  score: 0,
  phase: 'playing',          // 'playing' | 'animating'
  usedWordIndices: new Set(),
  currentWords: [],          // [{ word, trayCards: [{value, id, rotation}] }]
  pool: [],                  // [{value, id}]
};

export function saveProgress() {
  try {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify({
      round: state.round,
      score: state.score,
    }));
  } catch (_) {}
}

export function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(CONFIG.storageKey) || '{}');
    if (typeof saved.round === 'number' && saved.round >= 1) state.round = saved.round;
    if (typeof saved.score === 'number' && saved.score >= 0) state.score = saved.score;
  } catch (_) {}
}
