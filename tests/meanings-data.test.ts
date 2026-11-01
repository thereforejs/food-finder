import { names as germanNames } from "@thereforejs/foods/names/de";
import { names as englishNames } from "@thereforejs/foods/names/en";
import { describe, expect, test } from "vite-plus/test";
import { meanings as germanMeanings } from "../src/de/meanings.ts";
import { german } from "../src/de/language.ts";
import { meanings as englishMeanings } from "../src/en/meanings.ts";
import { english } from "../src/en/language.ts";
import { createFinder } from "../src/finder.ts";

// What a home cook types first. The meant food must lead, ahead of dishes that merely contain it
// ("Porridge mit Wasser") and of names that only start alike ("Butter rusk").
describe("everyday kitchen words on the BLS names", () => {
  const de = createFinder(germanNames, german, { meanings: [germanMeanings] });
  const en = createFinder(englishNames, english, { meanings: [englishMeanings] });

  test.each([
    ["Wasser", "N110000"],
    ["Salz", "R111000"],
    ["Hefe", "R459000"],
    ["Öl", "Q180000"],
    ["Margarine", "Q400000"],
    ["Quark", "M713100"],
    ["Essig", "R122000"],
    ["Stärke", "C446000"],
    ["Butter", "Q630000"],
    ["Zucker", "S111000"],
    ["Ei", "E111100"],
    ["Milch", "M111300"],
    ["Mehl", "C214100"],
  ])("German %s leads with %s", (query, code) => {
    expect(de.search(query)[0]).toMatchObject({ code, meant: true });
  });

  test.each([
    ["water", "N110000"],
    ["salt", "R111000"],
    ["yeast", "R459000"],
    ["oil", "Q180000"],
    ["margarine", "Q400000"],
    ["quark", "M713100"],
    ["vinegar", "R122000"],
    ["starch", "C446000"],
    ["butter", "Q630000"],
    ["sugar", "S111000"],
    ["egg", "E111100"],
    ["milk", "M111300"],
    ["flour", "C214100"],
    ["cream", "M173800"],
  ])("English %s leads with %s", (query, code) => {
    expect(en.search(query)[0]).toMatchObject({ code, meant: true });
  });
});
