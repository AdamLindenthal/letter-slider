import { tankAnimation }       from './tank.js';
import { grenadeAnimation }    from './grenade.js';
import { shotgunAnimation }    from './shotgun.js';
import { tntAnimation }        from './tnt.js';
import { atomicAnimation }     from './atomic.js';
import { droneAnimation }      from './drone.js';
import { helicopterAnimation } from './helicopter.js';
import { jetAnimation }        from './jet.js';
import { bomberAnimation }     from './bomber.js';
import { artilleryAnimation }  from './artillery.js';
import { spgAnimation }        from './spg.js';
import { scheduleSounds }      from '../audio.js';
import { clearCanvas, fadeOutCanvas } from '../canvas.js';
import { blowAwayTrayCards }   from '../render.js';

const ANIMATIONS = {
  tank:       tankAnimation,
  grenade:    grenadeAnimation,
  shotgun:    shotgunAnimation,
  tnt:        tntAnimation,
  atomic:     atomicAnimation,
  drone:      droneAnimation,
  helicopter: helicopterAnimation,
  jet:        jetAnimation,
  bomber:     bomberAnimation,
  artillery:  artilleryAnimation,
  spg:        spgAnimation,
};

const NAMES = Object.keys(ANIMATIONS);

/**
 * Play a random victory animation.
 *
 * Card blow-away is detected via MutationObserver: the moment any word label
 * gains the `.exploding` class (added by the animation at its explosion beat),
 * tray cards are simultaneously blasted away. This avoids tight coupling with
 * animation internals.
 *
 * Safety: a 9 s timeout races the animation so the game always advances even
 * if the animation Promise somehow never resolves (e.g. rAF error in older
 * browsers that bypasses the try-catch).
 */
export async function playVictoryAnimation(wordLabelEls, soundsData) {
  const name = NAMES[Math.floor(Math.random() * NAMES.length)];

  clearCanvas();

  if (soundsData[name]) {
    scheduleSounds(soundsData[name]);
  }

  // Watch for the explosion moment → blow away tray cards
  const wordsSection = document.getElementById('words-section');
  let cardsBLownAway = false;
  const observer = new MutationObserver(() => {
    if (!cardsBLownAway && document.querySelector('.word-label.exploding')) {
      cardsBLownAway = true;
      observer.disconnect();
      blowAwayTrayCards();
    }
  });
  if (wordsSection) {
    observer.observe(wordsSection, { attributes: true, subtree: true, attributeFilter: ['class'] });
  }

  // Race animation vs timeout (prevents infinite hang on rAF errors)
  const timeout = new Promise(resolve => setTimeout(resolve, 9000));
  let animPromise;
  try {
    animPromise = ANIMATIONS[name](wordLabelEls);
  } catch (err) {
    console.warn('[anim] Failed to start', name, err);
    animPromise = Promise.resolve();
  }

  try {
    await Promise.race([animPromise, timeout]);
  } catch (err) {
    console.warn('[anim] Error in', name, err);
  }

  observer.disconnect();
  await fadeOutCanvas(700);
}

/** Play a specific named animation — used by the debug panel. */
export async function playNamedAnimation(name, wordLabelEls, soundsData) {
  clearCanvas();

  if (soundsData[name]) {
    scheduleSounds(soundsData[name]);
  }

  const wordsSection = document.getElementById('words-section');
  let cardsBlownAway = false;
  const observer = new MutationObserver(() => {
    if (!cardsBlownAway && document.querySelector('.word-label.exploding')) {
      cardsBlownAway = true;
      observer.disconnect();
      blowAwayTrayCards();
    }
  });
  if (wordsSection) {
    observer.observe(wordsSection, { attributes: true, subtree: true, attributeFilter: ['class'] });
  }

  const timeout = new Promise(resolve => setTimeout(resolve, 9000));
  let animPromise;
  try {
    animPromise = (ANIMATIONS[name] || ANIMATIONS.tank)(wordLabelEls);
  } catch (err) {
    console.warn('[anim] Failed to start', name, err);
    animPromise = Promise.resolve();
  }

  try {
    await Promise.race([animPromise, timeout]);
  } catch (err) {
    console.warn('[anim] Error in', name, err);
  }

  observer.disconnect();
  await fadeOutCanvas(700);
}

/** Exposed so debug panel can enumerate and play specific animations. */
export { NAMES };
