# Sound Effects — Acquisition Guide

This document lists every sound effect the game needs, what is currently
missing or reused as a placeholder, and exactly where to save each file.

---

## Current state

The game has **3 raw sound files** today, plus the 4 tank-specific files:

| File on disk | Used for |
|---|---|
| `assets/soundfx/tank/moving.mp3` | Tank engine rolling in ✅ |
| `assets/soundfx/tank/aming.mp3` | Tank turret servo ✅ |
| `assets/soundfx/tank/fire.mp3` | Tank shot — also reused for artillery & SPG |
| `assets/soundfx/tank/impact.mp3` | Tank shell impact ✅ |
| `assets/soundfx/freesound_community-hq-explosion-6288.mp3` | Generic explosion (reused everywhere) |
| `assets/soundfx/freesound_community-grende-with-falling-earth-90860.mp3` | Grenade throw — also wrongly reused as TNT fuse, helicopter rocket, atomic rumble |
| `assets/soundfx/daviddumaisaudio-grenade-explosion-14-190266.mp3` | Grenade explosion — also reused for SPG, artillery impact |

Everything below is **missing** and should be acquired.

---

## Folder layout

Store all new files under `assets/soundfx/` using clean, descriptive
sub-folders:

```
assets/soundfx/
├── tank/               ← already complete
│   ├── moving.mp3
│   ├── aming.mp3
│   ├── fire.mp3
│   └── impact.mp3
├── common/             ← shared explosion / impact sounds
│   ├── explosion-large.mp3
│   └── explosion-small.mp3
├── grenade/
│   └── throw.mp3       ← already have, just rename/move
├── shotgun/
│   └── blast.mp3
├── tnt/
│   └── fuse.mp3
├── drone/
│   └── buzz.mp3
├── helicopter/
│   ├── rotor.mp3
│   └── rocket.mp3
├── jet/
│   └── flyby.mp3
├── bomber/
│   └── engines.mp3
├── artillery/
│   └── cannon.mp3
└── spg/
    └── engine.mp3
```

---

## Sounds to acquire

### 1. `assets/soundfx/tnt/fuse.mp3`
- **What it should sound like:** Sizzling, sparking fuse burning down — 2–4 s
- **Search terms:** "fuse sizzle", "burning fuse", "lit fuse spark"
- **Used by:** `tnt` animation at `startMs: 0`
- **Recommended source:** freesound.org — search *"fuse sizzle"*

---

### 2. `assets/soundfx/drone/buzz.mp3`
- **What it should sound like:** High-pitched electric whine of quadcopter
  rotors — at least 4 s, ideally loopable
- **Search terms:** "quadcopter drone", "drone buzz", "drone fly"
- **Used by:** `drone` animation at `startMs: 0`, volume 0.5
- **Recommended source:** freesound.org — search *"quadcopter fly"*

---

### 3. `assets/soundfx/helicopter/rotor.mp3`
- **What it should sound like:** Military helicopter rotor chop, low and
  heavy — 5+ s, ideally loopable
- **Search terms:** "helicopter rotor", "military helicopter", "chopper fly"
- **Used by:** `helicopter` animation at `startMs: 0`, volume 0.5
- **Recommended source:** freesound.org — search *"helicopter rotor loop"*

---

### 4. `assets/soundfx/helicopter/rocket.mp3`
- **What it should sound like:** Rocket or missile whoosh — short, 0.5–1 s
- **Search terms:** "rocket launch whoosh", "missile fire", "rocket swoosh"
- **Used by:** `helicopter` animation at `startMs: 3200`, volume 0.85
- **Recommended source:** freesound.org — search *"rocket whoosh"*

---

### 5. `assets/soundfx/jet/flyby.mp3`
- **What it should sound like:** Fighter jet screaming past at high speed,
  Doppler shift — 1–2 s
- **Search terms:** "fighter jet flyby", "jet engine pass", "jet sonic"
- **Used by:** `jet` animation at `startMs: 0`, volume 0.85
- **Recommended source:** freesound.org — search *"jet fighter flyby"*

---

### 6. `assets/soundfx/bomber/engines.mp3`
- **What it should sound like:** Deep rumble of 4 piston/jet engines droning
  overhead — 5+ s
- **Search terms:** "bomber plane", "b17 engines", "ww2 bomber", "propeller drone"
- **Used by:** `bomber` animation at `startMs: 0`, volume 0.55
- **Recommended source:** freesound.org — search *"ww2 bomber plane"*

---

### 7. `assets/soundfx/artillery/cannon.mp3`
- **What it should sound like:** Deep, booming cannon/howitzer blast —
  distinct from the tank shot (lower, louder, more reverb)
- **Search terms:** "cannon fire", "artillery shot", "howitzer boom"
- **Used by:** `artillery` and `spg` animations at their respective fire times
- **Recommended source:** freesound.org — search *"cannon fire artillery"*

---

### 8. `assets/soundfx/spg/engine.mp3`
- **What it should sound like:** Military truck or armoured vehicle engine
  idling / driving — 2–4 s
- **Search terms:** "military truck engine", "armored vehicle engine",
  "truck diesel"
- **Used by:** `spg` animation at `startMs: 0`, volume 0.5
- **Recommended source:** freesound.org — search *"military vehicle engine"*

---

### 9. `assets/soundfx/atomic/rumble.mp3`  *(optional but nice)*
- **What it should sound like:** Distant low-frequency rumble / air-raid
  siren building up — 2 s
- **Search terms:** "air raid siren", "nuclear alarm", "distant rumble"
- **Used by:** `atomic` animation at `startMs: 600`, volume 0.5
- **Recommended source:** freesound.org — search *"air raid siren short"*

---

## sounds.json — changes needed after acquiring files

Once all files are in place, update `sounds.json` as follows
(only entries that change from current placeholders):

```json
"tnt": {
  "fuse":      { "src": "assets/soundfx/tnt/fuse.mp3",              "startMs": 0,    "volume": 0.6 },
  "explosion": { ... unchanged ... }
},
"drone": {
  "buzz":      { "src": "assets/soundfx/drone/buzz.mp3",            "startMs": 0,    "volume": 0.5 },
  "explosion": { ... unchanged ... }
},
"helicopter": {
  "rotor":     { "src": "assets/soundfx/helicopter/rotor.mp3",      "startMs": 0,    "volume": 0.5 },
  "rocket":    { "src": "assets/soundfx/helicopter/rocket.mp3",     "startMs": 3200, "volume": 0.85 },
  "explosion": { ... unchanged ... }
},
"jet": {
  "flyby":     { "src": "assets/soundfx/jet/flyby.mp3",             "startMs": 0,    "volume": 0.85 },
  "explosion": { ... unchanged ... }
},
"bomber": {
  "engines":   { "src": "assets/soundfx/bomber/engines.mp3",        "startMs": 0,    "volume": 0.55 },
  "impact1":   { ... unchanged ... },
  "impact2":   { ... unchanged ... },
  "impact3":   { ... unchanged ... }
},
"artillery": {
  "fire":      { "src": "assets/soundfx/artillery/cannon.mp3",      "startMs": 3300, "volume": 1.0 },
  "impact":    { ... unchanged ... }
},
"spg": {
  "engine":    { "src": "assets/soundfx/spg/engine.mp3",            "startMs": 0,    "volume": 0.5 },
  "fire":      { "src": "assets/soundfx/artillery/cannon.mp3",      "startMs": 3050, "volume": 1.0 },
  "impact":    { ... unchanged ... }
},
"atomic": {
  "rumble":    { "src": "assets/soundfx/atomic/rumble.mp3",         "startMs": 600,  "volume": 0.5 },
  "blast":     { ... unchanged ... }
}
```

---

## Priority order

| Priority | Sound | Reason |
|---|---|---|
| 🔴 High | `jet/flyby.mp3` | Jet animation has **no** ambient sound at all |
| 🔴 High | `drone/buzz.mp3` | Drone animation has **no** ambient sound at all |
| 🔴 High | `bomber/engines.mp3` | Bomber animation has **no** ambient sound at all |
| 🟠 Medium | `artillery/cannon.mp3` | Currently reusing tank fire (different character) |
| 🟠 Medium | `helicopter/rotor.mp3` | Currently silent during approach |
| 🟠 Medium | `helicopter/rocket.mp3` | Currently reusing wrong sound |
| 🟡 Low | `tnt/fuse.mp3` | Currently reusing grenade throw sound |
| 🟡 Low | `spg/engine.mp3` | Nice to have vehicle ambience |
| 🟡 Low | `atomic/rumble.mp3` | Currently reusing grenade throw sound |
