import type { Language } from "../language.ts";

export const english: Language = {
  locale: "en",
  // "Crème", "rösti": typed without their accents.
  spell: (text) => text.normalize("NFD").replace(/\p{M}/gu, "").normalize("NFC"),
  same: new Map(),
};
