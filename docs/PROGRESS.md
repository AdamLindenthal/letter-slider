# Letter-Slider — Implementation Progress

## Status: Functional (needs playtesting)

---

## Session 1 — Initial Build

**Goal:** Implement the full plan from scratch.

**Delivered:**
- All 24 files: index.html, manifest.json, sw.js, sounds.json, 4 CSS files, 10 JS modules, 5 animation files, generate-icons.html, create-icons.js

**Bugs found and fixed during session 1:**
| Bug | Fix |
|-----|-----|
| `ctx.roundRect` not available on Chrome <99 | Added polyfill in tank.js (arc + lineTo) |
| Canvas blurry on high-DPI screens | `ctx.setTransform(dpr,0,0,dpr,0,0)` instead of `ctx.scale()` |
| Tank barrel pointed away from target | Fixed aimAngle formula: `Math.atan2(turretY-targetY, stopX-targetX)` |

---

## Session 2 — Tweaks

**User feedback:**
1. Letter cards in handwriting font → hard to read
2. Cards were all-caps → lowercase preferred
3. Too few pool cards → not enough searching
4. Game froze after completing a round → animation never triggered

**Root cause of freeze:** `requestAnimationFrame` callback errors are thrown into the browser's task queue, bypassing `try/catch` around `await`. The animation Promise never settled.

**Fixes:**
| Issue | Fix |
|-------|-----|
| Card font | Changed from `'Skolacek'` to `Verdana, 'Trebuchet MS', Geneva, sans-serif` |
| All-caps cards | Removed `.toUpperCase()` in words.js; stored lowercase NFC |
| Too few cards | `distractorCount`: 6 → 12 |
| Animation hang | Added `Promise.race([animPromise, 9s timeout])` in animations/index.js |
| `ctx.roundRect` errors | Added proper polyfill in tank.js |

---

## Session 3 — Major Feature Additions

**User requests:**
1. Layout: words horizontal row at top, pool at bottom (always)
2. Background: use 3 real camo JPEGs, rotate each round
3. Cards in tray blow away with the animation
4. Fire button (💣 STŘELBA!) — child manually triggers animation
5. Font: Georgia serif (clearer I vs l than Verdana)
6. Drop sound effects (subtle)
7. GitHub Pages hosting clarified (Python server is LOCAL-only; GH Pages works)
8. Debug mode via `?debug=1`
9. Four new animations: drone, helicopter, jet, bomber
10. docs/ directory created

**Delivered:**

| File | Change |
|------|--------|
| index.html | Added `data-bg`, `#fire-overlay`, `#debug-panel`; words always top row |
| css/main.css | Column layout only; `body[data-bg]` bg rotation rules; fire-overlay styles |
| css/tray.css | Compact word zones; `card-blast` keyframe with CSS custom properties |
| css/cards.css | Font → Georgia serif |
| js/audio.js | `playDropSound()` + `playRemoveSound()` via WebAudio oscillator |
| js/render.js | Added `blowAwayTrayCards()` |
| js/round.js | State machine with `'solved'` phase; fire button; bg rotation |
| js/drag.js | Allow drag in both `'playing'` and `'solved'` phases |
| js/animations/index.js | 9 animations; MutationObserver for blow-away; NAMES export |
| js/animations/drone.js | NEW — quadcopter, crosshair, bomb drop |
| js/animations/helicopter.js | NEW — gunship, hover bob, rocket |
| js/animations/jet.js | NEW — fast pass, missile, sonic boom |
| js/animations/bomber.js | NEW — 3 sequential bombs, one per word |
| js/debug.js | NEW — animation buttons, force-win, skip-round, phase display |
| js/main.js | Debug mode import |
| sw.js | v2; new files in precache |
| docs/ARCHITECTURE.md | NEW — full architecture reference |

**Known pending:**
- Readability of text over camo backgrounds (user said "adjust later after checking")
- End-to-end playtesting on an Android tablet
- PWA icons not yet generated (run generate-icons.html in browser)

---

## Known Issues / Watch List

| Issue | Severity | Notes |
|-------|----------|-------|
| Background readability | Medium | 3 camo JPGs not yet tested with word/card overlays; may need CSS text-shadow or card bg opacity boost |
| Sounds on iOS Safari | Medium | AudioContext may need unlock gesture — handled via `unlockAudio()` on first touch, but untested |
| Animation hang (mitigated) | Low | Promise.race timeout is 9s — any hang resolves after 9s |
| `aming.mp3` filename | None | File literally named `aming.mp3` (not a typo); sw.js and sounds.json match |
| Icons not generated | Low | Run `generate-icons.html` in a browser to produce icon-192.png + icon-512.png |
| Service worker scope | None | sw.js is at project root — correct for full-app scope |

---

## Verification Checklist

- [ ] Skolacek cursive renders on challenge word labels (Czech diacritics: ůčňáíě)
- [ ] Georgia serif renders on letter cards (I vs l distinction visible)
- [ ] Pool contains correct + distractor cards, shuffled each round
- [ ] Touch drag: ghost follows finger, drops at correct insert position, pool card unchanged
- [ ] Tap tray card: removes it; win condition no longer met
- [ ] Win condition: correct sequence → 💣 fire button appears
- [ ] Fire button tap: triggers animation, cards blow away
- [ ] All 9 animations play without console errors; canvas clears after
- [ ] Sounds play at correct timing (tank moving/aiming/fire/impact)
- [ ] Drop sounds play on card drop; remove sounds play on tap-to-remove
- [ ] Background rotates through bg1/bg2/bg3 with each round
- [ ] PWA installs to home screen (Android Chrome)
- [ ] Works fully offline after first load
- [ ] SW update toast appears after a code update; reload applies new version
- [ ] Debug mode (`?debug=1`): all animation buttons work; force-win fills trays; skip-round advances

---

## Next Steps (Future Sessions)

1. **Playtesting** — deploy to an Android tablet, observe real usage
2. **Background readability** — if text hard to read, add `text-shadow` or increase card `background` opacity
3. **Sound content** — current sounds: tank (4 files), grenade (3 MP3s). Drone/helicopter/jet/bomber use reused explosion sounds. Could add dedicated sounds.
4. **Word list expansion** — currently 25-30 words. Could add more, or add a difficulty selector.
5. **Score display** — HUD shows round + score, but no end-game summary.
6. **Teacher controls** — potential future: custom word list input, disable certain animations.
