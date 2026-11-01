import type { Meanings } from "../meanings.ts";

export const meanings: Meanings = {
  Butter: ["Q630000"],
  Ei: ["E111100"],
  // Spirit vinegar is what "Essig" means in a German kitchen; the others follow.
  Essig: ["R122000", "R121000", "R123100"],
  Hefe: ["R459000", "R458000"],
  Margarine: ["Q400000", "Q481000"],
  // Undefined on its own: every typed flour of wheat, rye and spelt, a human picks.
  Mehl: [
    "C214100",
    "C214200",
    "C213100",
    "C213200",
    "C213500",
    "C223100",
    "C223200",
    "C223300",
    "C223400",
    "C223600",
    "C234000",
    "C234100",
    "C234200",
  ],
  Milch: ["M111300"],
  Öl: ["Q180000", "Q320000", "Q120000"],
  Quark: ["M713100", "M713300", "M713500"],
  Sahne: ["M173800", "M173900"],
  Salz: ["R111000", "R114000"],
  // Speisestärke is mostly maize starch.
  Stärke: ["C446000", "C216000"],
  Wasser: ["N110000"],
  Zucker: ["S111000"],
};
