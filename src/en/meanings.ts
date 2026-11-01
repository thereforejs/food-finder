import type { Meanings } from "../meanings.ts";

export const meanings: Meanings = {
  butter: ["Q630000"],
  cream: ["M173800", "M173900"],
  egg: ["E111100"],
  // Undefined on its own: every typed flour of wheat, rye and spelt, a human picks.
  flour: [
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
  margarine: ["Q400000", "Q481000"],
  milk: ["M111300"],
  oil: ["Q180000", "Q320000", "Q120000"],
  quark: ["M713100", "M713300", "M713500"],
  salt: ["R111000", "R114000"],
  starch: ["C446000", "C216000"],
  sugar: ["S111000"],
  vinegar: ["R122000", "R121000", "R123100"],
  water: ["N110000"],
  yeast: ["R459000", "R458000"],
};
