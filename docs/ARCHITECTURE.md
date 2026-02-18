# Letter-Slider — Architecture Reference

## Overview
Czech first-grade letter/syllable assembly game. PWA (offline-capable). Designed for Android tablets in a classroom setting.

## Core Game Loop
```
startRound()
  → pick 3 words from WORDS[]
  → build pool (needed cards + 12 distractors)
  → render words-section (horizontal row at top)
  → render pool-section (flex-wrap grid at bottom)

User drags pool card → tray
  → dropCardInTray() → state update → renderTray() → playDropSound()
  → checkWinCondition()

User taps tray card
  → removeCardFromTray() → state update → renderTray() → playRemoveSound()
  → checkWinCondition()

checkWinCondition(): all trays match word.cards sequence?
  → state.phase = 'solved'  → show #fire-overlay button

User taps 💣 STŘELBA!
  → triggerVictory()
  → playVictoryAnimation() — random from 9 animations
     → MutationObserver detects .word-label.exploding → blowAwayTrayCards()
     → fadeOutCanvas()
  → state.round++ → startRound()
```

## State Machine
```
'playing' ←──────────────────────────────────┐
    │  all words correct                       │
    ▼                                          │
'solved'  ← user edits card (un-solves)       │
    │  user taps fire button                   │
    ▼                                          │
'animating'                                    │
    │  animation completes                     │
    └──────────────────────────────────────────┘
```

## File Structure
```
/
├── index.html            Shell — canvas, HUD, words-section, pool-section, fire-overlay
├── manifest.json         PWA manifest (standalone, olive theme, relative paths)
├── sw.js                 Service worker (cache-first, v2, safe update toast)
├── sounds.json           Cue timing map: animName → { cueName: {src,startMs,volume} }
├── css/
│   ├── main.css          Variables, body bg-image rotation, HUD, layout, fire-overlay, debug panel
│   ├── cards.css         Paper-cutout cards; Georgia font for I/l distinction
│   ├── tray.css          Word zones (horizontal row), trays, solved state, card-blast animation
│   └── toast.css         SW update toast
├── js/
│   ├── config.js         wordCount:3, distractorCount:12
│   ├── words.js          25 Czech words; lowercase NFC cards
│   ├── state.js          In-memory state + localStorage (round, score)
│   ├── main.js           init: fonts ready → resize → SW → startRound; debug mode
│   ├── round.js          startRound, dropCardInTray, removeCardFromTray,
│   │                     checkWinCondition, showFireButton, triggerVictory
│   ├── render.js         buildWordsSection, renderTray, buildPoolSection,
│   │                     setSolvedState, getWordLabelEls, updateHUD, blowAwayTrayCards
│   ├── drag.js           Unified touch+mouse DnD; copy semantics; tap-to-remove
│   ├── audio.js          AudioContext; preload; playSound; playDropSound; playRemoveSound
│   ├── canvas.js         DPR-correct resize; clearCanvas; fadeOutCanvas; W()/H()
│   ├── debug.js          Debug panel (only with ?debug=1)
│   └── animations/
│       ├── index.js      Random picker; sound schedule; MutationObserver card blow-away
│       ├── tank.js       Roll-in → aim → fire → shell → impact → exit
│       ├── grenade.js    Parabolic arc → land → shockwave rings
│       ├── shotgun.js    Barrel slide → muzzle flash → particle physics
│       ├── tnt.js        Crate + fuse → blocky explosion
│       ├── atomic.js     Body shake → mushroom cloud → screen flash
│       ├── drone.js      Quadcopter hover → drop payload → exit
│       ├── helicopter.js Gunship approach → hover → rocket → exit
│       ├── jet.js        High-speed pass → missile → sonic boom
│       └── bomber.js     Slow pass → 3 sequential bombs (one per word)
├── assets/
│   ├── fonts/skolacek-ce.otf   Czech cursive (challenge words only)
│   ├── backgrounds/            bg1.jpg / bg2.jpg / bg3.jpg — rotated each round
│   ├── icons/                  icon-192.png / icon-512.png (generate via generate-icons.html)
│   └── soundfx/                tank/ + grenade + explosion MP3s
├── generate-icons.html   Open in browser to download PWA icons
├── create-icons.js       Node.js icon generator (needs node-canvas or falls back to 1×1 placeholder)
└── docs/                 This directory
```

## Key Design Decisions

### Copy semantics
Pool cards are never consumed — dragging copies the value into the tray. This allows reuse across words and mistakes without refilling the pool.

### Ordered tray insertion
Cards snap to position by midpoint comparison. Insert index = first existing card whose centre X > drop X.

### Animation safety
`Promise.race([animation, 9s timeout])` in index.js ensures the game never gets stuck if an rAF callback throws (those errors bypass `try/catch` around `await`).

### Font choices
- **Challenge labels**: `Skolacek` (Czech cursive OTF, bundled)
- **Letter cards**: `Georgia, 'DejaVu Serif', serif` — capital I has clear horizontal serifs distinct from lowercase l; critical for 6-year-olds

### Background rotation
`document.body.dataset.bg = ((state.round - 1) % 3) + 1` triggers CSS rule `body[data-bg="N"]{ background-image: url(...) }`.

### Card blow-away
A `MutationObserver` watches `#words-section` for the moment any `.word-label` gains `.exploding`. This triggers `blowAwayTrayCards()` without any coupling to animation internals. Each animation controls its own explosion timing.

### Debug mode
Add `?debug=1` to the URL to show the debug panel at the bottom. Provides individual animation playback buttons and a "Force Win" shortcut.

## Deployment

### GitHub Pages
No server needed — the game is fully static. ES modules and service workers work on GitHub Pages (HTTPS). Steps:
1. Push the repo to GitHub
2. Enable Pages in repo Settings → Pages → Branch: `main` / root
3. Access at `https://yourusername.github.io/letter-slider/`

**Note**: `start_url: "./"` and `scope: "./"` in manifest.json are relative, so they work for any subdirectory deployment.

### Local Development
ES modules require HTTP (not `file://`):
```bash
python3 -m http.server 8080
# or
npx serve .
# then open http://localhost:8080
```

## Czech Language Notes
- All card values are stored lowercase, NFC-normalized
- Comparison is exact string match (both pool values and word.cards use same normalization)
- The word `display` field uses lowercase Czech for cursive rendering
- Diacritics: á č ď é ě í ň ó ř š ť ú ů ý ž — all preserved via NFC
