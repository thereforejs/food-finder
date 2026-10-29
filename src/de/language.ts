import type { Language } from "../language.ts";

const LETTERS: Record<string, string> = { ß: "ss", ä: "ae", ö: "oe", ü: "ue" };

export const german: Language = {
  locale: "de-DE",
  spell: (text) => text.replace(/[ßäöü]/g, (char) => LETTERS[char] ?? char),
  // The BLS writes "Type 550".
  same: new Map([["typ", "type"]]),
};
