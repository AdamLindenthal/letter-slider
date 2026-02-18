// `display` – lowercase Czech word rendered in the cursive challenge font.
// `cards`   – how the matching cards are labelled (lowercase, NFC-normalized).

export const WORDS = [
  // ── Single-letter words ─────────────────────────────────
  { display: "pes",    cards: ["p","e","s"] },        // dog
  { display: "kůň",   cards: ["k","ů","ň"] },        // horse
  { display: "les",   cards: ["l","e","s"] },         // forest
  { display: "rok",   cards: ["r","o","k"] },         // year
  { display: "den",   cards: ["d","e","n"] },         // day
  { display: "nos",   cards: ["n","o","s"] },         // nose
  { display: "dům",   cards: ["d","ů","m"] },         // house
  { display: "led",   cards: ["l","e","d"] },         // ice
  { display: "sad",   cards: ["s","a","d"] },         // orchard
  { display: "rak",   cards: ["r","a","k"] },         // crayfish
  { display: "had",   cards: ["h","a","d"] },         // snake
  { display: "vůl",   cards: ["v","ů","l"] },         // ox
  { display: "mak",   cards: ["m","a","k"] },         // poppy

  // ── Syllable words ──────────────────────────────────────
  { display: "kočka", cards: ["ko","č","ka"] },       // cat
  { display: "máma",  cards: ["má","ma"] },           // mum
  { display: "táta",  cards: ["tá","ta"] },           // dad
  { display: "bota",  cards: ["bo","ta"] },           // shoe
  { display: "ryba",  cards: ["ry","ba"] },           // fish
  { display: "hlava", cards: ["hla","va"] },          // head
  { display: "moře",  cards: ["mo","ře"] },           // sea
  { display: "auto",  cards: ["au","to"] },           // car
  { display: "okno",  cards: ["ok","no"] },           // window
  { display: "hora",  cards: ["ho","ra"] },           // mountain
  { display: "kráva", cards: ["krá","va"] },          // cow
  { display: "řeka",  cards: ["ře","ka"] },           // river
  { display: "jaro",  cards: ["ja","ro"] },           // spring
  { display: "zima",  cards: ["zi","ma"] },           // winter
  { display: "léto",  cards: ["lé","to"] },           // summer
  { display: "žába",  cards: ["žá","ba"] },           // frog
  { display: "kniha", cards: ["kni","ha"] },          // book
].map(w => ({
  display: w.display,
  cards: w.cards.map(c => c.normalize('NFC')),
}));

export const PHRASES = [
  {
    label: "Rodina",
    words: [
      { display: "máma", cards: ["má","ma"] },
      { display: "táta", cards: ["tá","ta"] },
    ],
  },
];

/** All distinct card values across every word (used to fill the distractor pool). */
export function getAllCardValues() {
  return [...new Set(WORDS.flatMap(w => w.cards))];
}
