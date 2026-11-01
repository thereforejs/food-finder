import { names } from "@thereforejs/foods/names/de";
import { describe, expect, test } from "vite-plus/test";
import { german } from "../src/de/language.ts";
import { meanings as germanMeanings } from "../src/de/meanings.ts";
import { english } from "../src/en/language.ts";
import { meanings as englishMeanings } from "../src/en/meanings.ts";
import type { Language } from "../src/language.ts";
import type { Meanings } from "../src/meanings.ts";
import { words } from "../src/words.ts";

const files: [string, Meanings, Language][] = [
  ["German", germanMeanings, german],
  ["English", englishMeanings, english],
];

describe.each(files)("%s meanings", (_, meanings, language) => {
  const keys = Object.keys(meanings);

  // Codes are the same in every language; the German names hold them all.
  test("every code of a meaning is a food of the installed foods", () => {
    const unknown = Object.values(meanings)
      .flat()
      .filter((code) => !(code in names));
    expect(unknown).toEqual([]);
  });

  test("the words are sorted, so a contribution lands in one place", () => {
    expect(keys).toEqual([...keys].sort((a, b) => a.localeCompare(b, language.locale)));
  });

  test("no two words read the same", () => {
    const read = keys.map((key) => words(key, language).join(" "));
    expect(new Set(read).size).toBe(read.length);
  });

  test("every word means at least one food, each once", () => {
    for (const codes of Object.values(meanings)) {
      expect(codes.length).toBeGreaterThan(0);
      expect(new Set(codes).size).toBe(codes.length);
    }
  });
});
