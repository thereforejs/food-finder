import { describe, expect, test } from "vite-plus/test";
import { heads } from "../src/compounds.ts";

const read = (word: string, known: string[], units: string[] = []) =>
  heads(word, { known: new Set(known), units, found: new Map() });

describe("heads", () => {
  test("a compound ends with every known word it agrees with", () => {
    expect(read("roggenvollkornbrot", ["roggen", "vollkornbrot", "brot"])).toEqual([
      "vollkornbrot",
      "brot",
    ]);
  });

  test("a stem is a syllable", () => {
    expect(read("schwein", ["wein"])).toEqual([]);
  });

  test("a sure split rules out the readings against it", () => {
    expect(read("erdbeereis", ["erdbeer", "eis", "reis"])).toEqual(["eis"]);
    expect(read("glutenfrei", ["gluten", "frei", "ei"])).toEqual(["frei"]);
  });

  test("a unit is never split, a cut at its edge leaves it whole", () => {
    const known = ["buchweizen", "weizenbrot", "weizen", "brot", "dunkel"];
    expect(read("buchweizenbrot", known, ["buchweizen"])).toEqual(["brot"]);
    expect(read("dunkelbuchweizen", known, ["buchweizen"])).toEqual(["buchweizen"]);
    expect(read("buchweizenbuchweizenbrot", known, ["buchweizen"])).toEqual(["brot"]);
  });
});
