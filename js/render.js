import { state } from './state.js';

let wordZoneEls = [];

/** Rebuild entire words section from scratch. */
export function buildWordsSection(currentWords) {
  const section = document.getElementById('words-section');
  section.innerHTML = '';
  wordZoneEls = [];

  for (const [i, { word }] of currentWords.entries()) {
    const zone = document.createElement('div');
    zone.className = 'word-zone';
    zone.dataset.wordIndex = i;

    const label = document.createElement('div');
    label.className = 'word-label';
    label.textContent = word.display;

    const tray = document.createElement('div');
    tray.className = 'word-tray';
    tray.dataset.wordIndex = i;

    zone.append(label, tray);
    section.appendChild(zone);
    wordZoneEls.push(zone);
  }
}

/** Re-render just one tray's cards (called after state mutation). */
export function renderTray(wordIndex, trayCards) {
  const tray = document.querySelector(`.word-tray[data-word-index="${wordIndex}"]`);
  if (!tray) return;
  tray.innerHTML = '';
  for (const card of trayCards) {
    tray.appendChild(buildCardEl(card.value, card.id, 'tray', card.rotation));
  }
}

/** Render the pool of letter cards. Called once per round. */
export function buildPoolSection(poolCards) {
  const container = document.getElementById('pool-cards');
  container.innerHTML = '';
  // Apply grid layout inline so it works even if CSS is served from cache
  const cols = poolCards.length / 4;
  container.style.display = 'grid';
  container.style.gridTemplateColumns = `repeat(${cols}, auto)`;
  container.style.justifyContent = 'center';
  container.style.alignContent = 'center';
  for (const card of poolCards) {
    const rotation = +(Math.random() * 6 - 3).toFixed(1);
    container.appendChild(buildCardEl(card.value, card.id, 'pool', rotation));
  }
}

/** Build a single `.letter-card` DOM element. */
export function buildCardEl(value, id, context, rotation) {
  const el = document.createElement('div');
  el.className = 'letter-card';
  el.dataset.cardId = id;
  el.dataset.cardValue = value;
  el.dataset.cardContext = context;
  el.textContent = value;
  el.style.transform = `rotate(${rotation ?? 0}deg)`;
  return el;
}

/** Toggle `.solved` on a word zone. */
export function setSolvedState(wordIndex, solved) {
  const zone = wordZoneEls[wordIndex];
  if (zone) zone.classList.toggle('solved', solved);
}

/** Return all `.word-label` elements in current words section. */
export function getWordLabelEls() {
  return wordZoneEls.map(z => z.querySelector('.word-label')).filter(Boolean);
}

/** Sync HUD display from state. */
export function updateHUD() {
  document.getElementById('hud-round').textContent = `Kolo: ${state.round}`;
  document.getElementById('hud-score').textContent = `Body: ${state.score}`;
}

/**
 * Animate all tray cards flying off screen (called when victory animation fires).
 * Uses CSS custom properties for random blast direction per card.
 */
export function blowAwayTrayCards() {
  const cards = document.querySelectorAll('.word-tray .letter-card');
  cards.forEach(card => {
    const tx = ((Math.random() - 0.5) * 250).toFixed(0);
    const ty = (-(40 + Math.random() * 180)).toFixed(0);
    const br = ((Math.random() - 0.5) * 120).toFixed(0);
    card.style.setProperty('--bx', `${tx}px`);
    card.style.setProperty('--by', `${ty}px`);
    card.style.setProperty('--br', `${br}deg`);
    card.classList.add('card-blown');
  });
}
