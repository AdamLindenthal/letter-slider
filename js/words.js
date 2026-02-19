// `display`   – lowercase Czech word shown in the cursive challenge font.
// `syllables` – optional syllable split for the pool (e.g. ["ko","č","ka"]).
//               Omit for words where individual letters are the only grouping.

export const WORDS = [
  // ── Letters only (no syllable grouping needed) ───────────
  { display: "pes"  },   // dog
  { display: "kůň"  },   // horse
  { display: "les"  },   // forest
  { display: "rok"  },   // year
  { display: "den"  },   // day
  { display: "nos"  },   // nose
  { display: "dům"  },   // house
  { display: "led"  },   // ice
  { display: "sad"  },   // orchard
  { display: "rak"  },   // crayfish
  { display: "had"  },   // snake
  { display: "vůl"  },   // ox
  { display: "mak"  },   // poppy

  // ── With syllable grouping ────────────────────────────────
  { display: "kočka", syllables: ["ko","č","ka"] },   // cat
  { display: "máma",  syllables: ["má","ma"] },        // mum
  { display: "táta",  syllables: ["tá","ta"] },        // dad
  { display: "bota",  syllables: ["bo","ta"] },        // shoe
  { display: "ryba",  syllables: ["ry","ba"] },        // fish
  { display: "hlava", syllables: ["hla","va"] },       // head
  { display: "moře",  syllables: ["mo","ře"] },        // sea
  { display: "auto",  syllables: ["au","to"] },        // car
  { display: "okno",  syllables: ["ok","no"] },        // window
  { display: "hora",  syllables: ["ho","ra"] },        // mountain
  { display: "kráva", syllables: ["krá","va"] },       // cow
  { display: "řeka",  syllables: ["ře","ka"] },        // river
  { display: "jaro",  syllables: ["ja","ro"] },        // spring
  { display: "zima",  syllables: ["zi","ma"] },        // winter
  { display: "léto",  syllables: ["lé","to"] },        // summer
  { display: "žába",  syllables: ["žá","ba"] },        // frog
  { display: "kniha", syllables: ["kni","ha"] },       // book
].map(w => ({
  display:   w.display.normalize('NFC'),
  syllables: w.syllables?.map(s => s.normalize('NFC')) ?? null,
}));

export const PHRASES = [
  {
    label: "Rodina",
    words: [
      { display: "máma", syllables: ["má","ma"] },
      { display: "táta", syllables: ["tá","ta"] },
    ],
  },
];

/** Card values a single word contributes to the pool: syllables + individual letters. */
export function getWordCards(word) {
  const letters   = [...word.display];
  const syllables = word.syllables ?? [];
  return [...new Set([...syllables, ...letters])];
}

/** All distinct card values across every word (used to fill the distractor pool). */
export function getAllCardValues() {
  return [...new Set(WORDS.flatMap(getWordCards))];
}
