import { CONFIG } from './config.js';
import { state, saveProgress } from './state.js';
import { WORDS, getAllCardValues, getWordCards } from './words.js';
import {
  buildWordsSection, buildPoolSection, renderTray,
  setSolvedState, getWordLabelEls, updateHUD,
} from './render.js';
import { attachDragHandlers } from './drag.js';
import { playVictoryAnimation } from './animations/index.js';
import { playDropSound, playRemoveSound } from './audio.js';

let idCounter = 0;
function nextId() { return ++idCounter; }

let soundsData = {};
export function setSoundsData(data) { soundsData = data; }

// ── Round setup ───────────────────────────────────────────

export function startRound() {
  // Exhaust all words before repeating
  if (state.usedWordIndices.size >= WORDS.length) {
    state.usedWordIndices.clear();
  }

  const available = WORDS.map((_, i) => i).filter(i => !state.usedWordIndices.has(i));
  const selected  = shuffle(available).slice(0, Math.min(CONFIG.wordCount, available.length));
  selected.forEach(i => state.usedWordIndices.add(i));

  const words = selected.map(i => WORDS[i]);

  // Pool: syllables (if defined) + individual letters + distractors.
  const needed = [...new Set(words.flatMap(getWordCards))];
  const allCards   = getAllCardValues();
  const distractors = shuffle(allCards.filter(v => !needed.includes(v)))
    .slice(0, CONFIG.distractorCount);

  // Pad total to next multiple of 4 (for the 4-row grid layout).
  const baseValues = [...needed, ...distractors];
  const target = Math.ceil(baseValues.length / 4) * 4;
  const padCount = target - baseValues.length;
  if (padCount > 0) {
    const alreadyIn = new Set(baseValues);
    const fresh = shuffle(allCards.filter(v => !alreadyIn.has(v)));
    const fallback = shuffle([...allCards]);
    const padding = [...fresh, ...fallback].slice(0, padCount);
    baseValues.push(...padding);
  }

  const poolCards = shuffle(baseValues).map(v => ({ value: v, id: nextId() }));

  // State reset
  state.currentWords = words.map(word => ({ word, trayCards: [] }));
  state.pool         = poolCards;
  state.phase        = 'playing';

  // Rotate background image (1, 2, 3, 1, 2, 3…)
  document.body.dataset.bg = ((state.round - 1) % 3) + 1;

  // Render
  buildWordsSection(state.currentWords);
  buildPoolSection(poolCards);
  attachDragHandlers();
  updateHUD();
  hideFireButton();
}

// ── Card drop / remove ────────────────────────────────────

export function dropCardInTray(wordIndex, cardValue, insertIndex) {
  if (state.phase !== 'playing' && state.phase !== 'solved') return;
  const rotation = +(Math.random() * 6 - 3).toFixed(1);
  const newCard  = { value: cardValue, id: nextId(), rotation };
  state.currentWords[wordIndex].trayCards.splice(insertIndex, 0, newCard);
  renderTray(wordIndex, state.currentWords[wordIndex].trayCards);
  playDropSound();
  checkWinCondition();
}

export function removeCardFromTray(wordIndex, cardId) {
  if (state.phase !== 'playing' && state.phase !== 'solved') return;
  const trayCards = state.currentWords[wordIndex].trayCards;
  const idx = trayCards.findIndex(c => c.id === cardId);
  if (idx >= 0) trayCards.splice(idx, 1);
  renderTray(wordIndex, trayCards);
  playRemoveSound();
  // Re-check: removing a card can un-solve a word zone
  checkWinCondition();
}

// ── Win condition ─────────────────────────────────────────

export function checkWinCondition() {
  if (state.phase !== 'playing' && state.phase !== 'solved') return;

  let allSolved = true;
  for (let i = 0; i < state.currentWords.length; i++) {
    const { word, trayCards } = state.currentWords[i];
    const trayText = trayCards.map(c => c.value).join('').normalize('NFC');
    const solved = trayText === word.display.normalize('NFC');
    setSolvedState(i, solved);
    if (!solved) allSolved = false;
  }

  if (allSolved) {
    state.phase = 'solved';
    showFireButton();
  } else {
    // If user removes a card while in 'solved' state, revert
    if (state.phase === 'solved') {
      state.phase = 'playing';
      hideFireButton();
    }
  }
}

// ── Fire button ───────────────────────────────────────────

function showFireButton() {
  const overlay = document.getElementById('fire-overlay');
  overlay.classList.remove('hidden');
  overlay.addEventListener('click', onFireClick, { once: true });
}

function hideFireButton() {
  const overlay = document.getElementById('fire-overlay');
  overlay.classList.add('hidden');
}

function onFireClick() {
  if (state.phase !== 'solved') return;
  triggerVictory();
}

// ── Victory flow ──────────────────────────────────────────

async function triggerVictory() {
  state.phase = 'animating';
  hideFireButton();

  const wordLabels = getWordLabelEls();
  await playVictoryAnimation(wordLabels, soundsData);

  state.round++;
  state.score += state.currentWords.length * 10;
  saveProgress();
  startRound();
}

// Exposed for debug mode
export { triggerVictory };

// ── Helpers ───────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
