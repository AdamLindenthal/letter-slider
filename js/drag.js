import { state } from './state.js';
import { dropCardInTray, removeCardFromTray } from './round.js';

let drag = null;
let handlersAttached = false;

/** Call once per round (idempotent — attaches handlers only once). */
export function attachDragHandlers() {
  if (handlersAttached) return;
  handlersAttached = true;
  document.addEventListener('touchstart', onTouchStart, { passive: false });
  document.addEventListener('mousedown', onMouseDown);
}

// ── Start ─────────────────────────────────────────────────────────

function onTouchStart(e) {
  if (state.phase !== 'playing' && state.phase !== 'solved') return;
  const card = e.target.closest('.letter-card');
  if (!card) return;
  e.preventDefault();
  const t = e.touches[0];
  startDrag(card, t.clientX, t.clientY);
}

function onMouseDown(e) {
  if (state.phase !== 'playing' && state.phase !== 'solved') return;
  const card = e.target.closest('.letter-card');
  if (!card) return;
  e.preventDefault();
  startDrag(card, e.clientX, e.clientY);
}

function startDrag(card, clientX, clientY) {
  const rect = card.getBoundingClientRect();

  drag = {
    active: true,
    sourceCard: card,
    cardValue: card.dataset.cardValue,
    cardId: Number(card.dataset.cardId),
    cardContext: card.dataset.cardContext,
    wordIndex: Number(card.closest('[data-word-index]')?.dataset.wordIndex ?? -1),
    startX: clientX,
    startY: clientY,
    offsetX: clientX - rect.left,
    offsetY: clientY - rect.top,
    ghost: null,
    lastTray: null,
  };

  // Create ghost
  const ghost = card.cloneNode(true);
  ghost.classList.add('ghost-card');
  ghost.removeAttribute('data-card-context');  // visually neutral ghost
  ghost.style.position     = 'fixed';
  ghost.style.left         = `${rect.left}px`;
  ghost.style.top          = `${rect.top}px`;
  ghost.style.width        = `${rect.width}px`;
  ghost.style.height       = `${rect.height}px`;
  ghost.style.pointerEvents = 'none';
  ghost.style.zIndex       = '50';
  ghost.style.margin       = '0';
  document.body.appendChild(ghost);
  drag.ghost = ghost;

  document.addEventListener('touchmove', onTouchMove, { passive: false });
  document.addEventListener('touchend',  onTouchEnd,  { passive: false });
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup',   onMouseUp);
}

// ── Move ─────────────────────────────────────────────────────────

function onTouchMove(e) {
  if (!drag?.active) return;
  e.preventDefault();
  const t = e.touches[0];
  moveGhost(t.clientX, t.clientY);
}

function onMouseMove(e) {
  if (!drag?.active) return;
  moveGhost(e.clientX, e.clientY);
}

function moveGhost(clientX, clientY) {
  const g = drag.ghost;
  g.style.left = `${clientX - drag.offsetX}px`;
  g.style.top  = `${clientY - drag.offsetY}px`;

  // Ghost has pointer-events:none so elementFromPoint sees through it
  const el = document.elementFromPoint(clientX, clientY);

  const tray = el?.closest('.word-tray') ?? null;
  if (tray !== drag.lastTray) {
    drag.lastTray?.classList.remove('drag-over');
    tray?.classList.add('drag-over');
    drag.lastTray = tray;
  }
}

// ── End ───────────────────────────────────────────────────────────

function onTouchEnd(e) {
  if (!drag?.active) return;
  const t = e.changedTouches[0];
  endDrag(t.clientX, t.clientY);
}

function onMouseUp(e) {
  if (!drag?.active) return;
  endDrag(e.clientX, e.clientY);
}

function endDrag(clientX, clientY) {
  const { ghost, startX, startY, cardValue, cardId, cardContext, wordIndex, lastTray } = drag;

  lastTray?.classList.remove('drag-over');
  ghost.remove();

  document.removeEventListener('touchmove', onTouchMove);
  document.removeEventListener('touchend',  onTouchEnd);
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup',   onMouseUp);

  const dist = Math.hypot(clientX - startX, clientY - startY);

  // Tap on a tray card → remove it
  if (dist < 8 && cardContext === 'tray') {
    const cardEl = drag.sourceCard;
    cardEl.style.transition = 'transform 0.15s ease, opacity 0.15s ease';
    cardEl.style.transform = 'scale(0)';
    cardEl.style.opacity = '0';
    setTimeout(() => removeCardFromTray(wordIndex, cardId), 150);
    drag = null;
    return;
  }

  // Find drop target
  const el = document.elementFromPoint(clientX, clientY);
  const tray = el?.closest('.word-tray');

  if (tray) {
    const targetWordIndex = Number(tray.dataset.wordIndex);
    const insertIndex = getInsertIndex(tray, clientX);
    dropCardInTray(targetWordIndex, cardValue, insertIndex);
  }

  drag = null;
}

/** Find insert position in tray based on horizontal drop coordinate. */
function getInsertIndex(trayEl, dropX) {
  const cards = [...trayEl.querySelectorAll('.letter-card')];
  for (let i = 0; i < cards.length; i++) {
    const rect = cards[i].getBoundingClientRect();
    if (dropX < rect.left + rect.width / 2) return i;
  }
  return cards.length;
}
