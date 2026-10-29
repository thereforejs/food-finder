import type { Language } from "./language.ts";
import { words } from "./words.ts";

/**
 * What people mean by an everyday word: the word as people write it, to the codes it means, the
 * most meant first. `{ Butter: ["Q630000"] }`: "Butter" is "Süßrahmbutter".
 */
export type Meanings = Record<string, string[]>;

/** A word of a meaning, read, and the place of the food in it. */
export type Meant = { words: string[]; order: number };

/** The meanings of every code, the first source winning a word. */
export function readMeanings(sources: Meanings[], language: Language): Map<string, Meant[]> {
  const taken = new Set<string>();
  const byCode = new Map<string, Meant[]>();
  for (const source of sources) {
    for (const [key, codes] of Object.entries(source)) {
      const read = words(key, language);
      const id = read.join(" ");
      if (taken.has(id)) continue;
      taken.add(id);
      codes.forEach((code, order) => {
        byCode.set(code, [...(byCode.get(code) ?? []), { words: read, order }]);
      });
    }
  }
  return byCode;
}
