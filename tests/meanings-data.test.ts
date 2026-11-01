import { names as germanNames } from "@thereforejs/foods/names/de";
import { names as englishNames } from "@thereforejs/foods/names/en";
import { describe, expect, test } from "vite-plus/test";
import { meanings as germanMeanings } from "../src/de/meanings.ts";
import { german } from "../src/de/language.ts";
import { meanings as englishMeanings } from "../src/en/meanings.ts";
import { english } from "../src/en/language.ts";
import { createFinder } from "../src/finder.ts";

// What a home cook types first. The meant foods lead, every one in the order of its meaning, ahead
// of dishes that merely contain them ("Porridge mit Wasser") and of names that only start alike
// ("Butter rusk"). The codes are written out by hand, so a dropped or reordered code fails here.
const flours = [
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
];

function meantFirst(finder: ReturnType<typeof createFinder>, query: string, codes: string[]) {
  const hits = finder.search(query);
  expect(hits.slice(0, codes.length).map(({ code, meant }) => ({ code, meant }))).toEqual(
    codes.map((code) => ({ code, meant: true })),
  );
  // Nothing else is meant: the next hit is an ordinary one.
  expect(hits[codes.length]?.meant ?? false).toBe(false);
}

describe("everyday kitchen words on the BLS names", () => {
  const de = createFinder(germanNames, german, { meanings: [germanMeanings] });
  const en = createFinder(englishNames, english, { meanings: [englishMeanings] });

  test.each([
    ["Butter", ["Q630000"]],
    ["Ei", ["E111100"]],
    ["Essig", ["R122000", "R121000", "R123100"]],
    ["Hefe", ["R459000", "R458000"]],
    ["Margarine", ["Q400000", "Q481000"]],
    ["Mehl", flours],
    ["Milch", ["M111300"]],
    ["Öl", ["Q180000", "Q320000", "Q120000"]],
    ["Quark", ["M713100", "M713300", "M713500"]],
    ["Sahne", ["M173800", "M173900"]],
    ["Salz", ["R111000", "R114000"]],
    ["Stärke", ["C446000", "C216000"]],
    ["Wasser", ["N110000"]],
    ["Zucker", ["S111000"]],
  ])("German %s leads with %j", (query, codes) => {
    meantFirst(de, query, codes);
  });

  test.each([
    ["butter", ["Q630000"]],
    ["cream", ["M173800", "M173900"]],
    ["egg", ["E111100"]],
    ["flour", flours],
    ["margarine", ["Q400000", "Q481000"]],
    ["milk", ["M111300"]],
    ["oil", ["Q180000", "Q320000", "Q120000"]],
    ["quark", ["M713100", "M713300", "M713500"]],
    ["salt", ["R111000", "R114000"]],
    ["starch", ["C446000", "C216000"]],
    ["sugar", ["S111000"]],
    ["vinegar", ["R122000", "R121000", "R123100"]],
    ["water", ["N110000"]],
    ["yeast", ["R459000", "R458000"]],
  ])("English %s leads with %j", (query, codes) => {
    meantFirst(en, query, codes);
  });
});
