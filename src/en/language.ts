import type { Language } from "../language.ts";

export const english: Language = {
  locale: "en",
  // "Crème", "rösti": typed without their accents.
  spell: (text) => text.normalize("NFD").replace(/\p{M}/gu, "").normalize("NFC"),
  same: new Map(),
  // "Shallots" are "Shallot raw"; four letters stay at least, so "Peas" and "Oats" keep theirs.
  stem: (word) => (word.endsWith("s") && word.length > 4 ? word.slice(0, -1) : word),
};
