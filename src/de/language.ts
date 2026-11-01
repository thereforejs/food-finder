import type { Language } from "../language.ts";

const LETTERS: Record<string, string> = { ß: "ss", ä: "ae", ö: "oe", ü: "ue" };

// The longest first: "Tomaten" is "Tomat-en", never "Tomate-n" left as "tomate" against "tomat".
const PLURALS = ["en", "e", "n", "s"];

// Plurals that change the vowel, as typed without umlauts: "Haselnüsse" are "Haselnuss".
const UMLAUT_PLURALS = [
  ["nuesse", "nuss"],
  ["aepfel", "apfel"],
];

// One ending off; four letters stay at least, so "Ei", "Eis" and "Reis" keep theirs.
function cut(word: string): string {
  const ending = PLURALS.find((end) => word.endsWith(end) && word.length - end.length >= 4);
  return ending ? word.slice(0, -ending.length) : word;
}

export const german: Language = {
  locale: "de-DE",
  // Other accents are typed without them: "Crème fraîche" is "Creme fraiche".
  spell: (text) =>
    text
      .replace(/[ßäöü]/g, (char) => LETTERS[char] ?? char)
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .normalize("NFC"),
  // The BLS writes "Type 550" and "Broccoli".
  same: new Map([
    ["typ", "type"],
    ["brokkoli", "broccoli"],
  ]),
  compounds: { endings: ["frei"], units: ["buchweizen"] },
  stem: (word) => {
    const umlaut = UMLAUT_PLURALS.find(([plural]) => word.endsWith(plural));
    // Until nothing changes, so both forms meet: "Champignons" and "Champignon" are "champigno".
    let stem = umlaut ? word.slice(0, -umlaut[0].length) + umlaut[1] : word;
    for (let shorter = cut(stem); shorter !== stem; shorter = cut(stem)) stem = shorter;
    return stem;
  },
};
