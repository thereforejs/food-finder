import type { Language } from "../language.ts";

export const english: Language = {
  locale: "en",
  // "Crème", "rösti": typed without their accents.
  spell: (text) => text.normalize("NFD").replace(/\p{M}/gu, "").normalize("NFC"),
  same: new Map(),
  dish: "with",
  preparations: [
    "raw",
    "cooked",
    "boiled",
    "fried",
    "stewed",
    "steamed",
    "baked",
    "grilled",
    "braised",
    "roasted",
    "dried",
    "frozen",
    "ground",
  ],
  stem: (word) => {
    if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
    if (word.length > 4 && word.endsWith("oes")) return word.slice(0, -2);
    // The BLS writes "Potatoe peeled, raw".
    if (word.length > 4 && word.endsWith("oe")) return word.slice(0, -1);
    // Singulars that end in s: "Asparagus", "Cress", "Hummus".
    if (/(ss|us|is)$/.test(word)) return word;
    return word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word;
  },
};
