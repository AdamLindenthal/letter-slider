/**
 * Debug panel — loaded only when ?debug=1 is in the URL.
 *
 * Usage:  http://localhost:8080/?debug=1
 *
 * Features:
 *   • Play any individual animation without completing a round
 *   • Force-win the current round (auto-fill all trays correctly)
 *   • Skip to next round directly
 */
import { NAMES, playNamedAnimation } from './animations/index.js';
import { state } from './state.js';
import { startRound, triggerVictory } from './round.js';
import { getWordLabelEls } from './render.js';

export function initDebugPanel(soundsData) {
  const panel = document.getElementById('debug-panel');
  panel.classList.remove('hidden');

  const label = mk('span', '🐛 DEBUG: ');
  label.style.cssText = 'color:#888;font-size:0.7rem;align-self:center;';
  panel.appendChild(label);

  // — Play each animation ———————————————————————————————
  for (const name of NAMES) {
    const btn = mk('button', `▶ ${name}`);
    btn.addEventListener('click', async () => {
      const els = getWordLabelEls();
      // Remove .exploding so re-use works
      els.forEach(el => el.classList.remove('exploding'));
      await playNamedAnimation(name, els, soundsData);
    });
    panel.appendChild(btn);
  }

  panel.appendChild(mk('span', ' | '));

  // — Force win ————————————————————————————————————————
  const winBtn = mk('button', '✓ Force Win');
  winBtn.style.borderColor = '#4f4';
  winBtn.style.color = '#4f4';
  winBtn.addEventListener('click', () => {
    // Fill each tray with the correct sequence
    import('./round.js').then(({ dropCardInTray }) => {
      for (let i = 0; i < state.currentWords.length; i++) {
        // Clear existing tray first by removing all cards
        state.currentWords[i].trayCards = [];
        // Rebuild with correct cards
        const correctCards = state.currentWords[i].word.cards;
        for (let j = 0; j < correctCards.length; j++) {
          dropCardInTray(i, correctCards[j], j);
        }
      }
    });
  });
  panel.appendChild(winBtn);

  // — Skip round ————————————————————————————————————————
  const skipBtn = mk('button', '⏭ Skip Round');
  skipBtn.addEventListener('click', () => {
    state.phase = 'playing'; // reset if stuck
    state.round++;
    startRound();
  });
  panel.appendChild(skipBtn);

  // — Phase display ————————————————————————————————————
  const phaseEl = mk('span', '');
  phaseEl.style.cssText = 'color:#aaa;font-size:0.7rem;align-self:center;margin-left:6px;';
  panel.appendChild(phaseEl);

  setInterval(() => {
    phaseEl.textContent = `phase:${state.phase} round:${state.round}`;
  }, 500);
}

function mk(tag, text) {
  const el = document.createElement(tag);
  el.textContent = text;
  return el;
}
