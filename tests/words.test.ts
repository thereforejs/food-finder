import fc from "fast-check";
import { describe, expect, test } from "vite-plus/test";
import { german } from "../src/de/language.ts";
import { english } from "../src/en/language.ts";
import { words } from "../src/words.ts";

describe("German", () => {
  test.each([
    ["Weißbrot", ["weissbrot"]],
    ["WEISSBROT", ["weissbrot"]],
    ["Käse", ["kaese"]],
    ["Weizen-Mehl", ["weizen", "mehl"]],
    ["Weizen Mehl, Type 550", ["weizen", "mehl", "type", "550"]],
    ["Typ 550", ["type", "550"]],
    ["Weizenkleber/Weizengluten", ["weizenkleber", "weizengluten"]],
    ["mit Milch 3,5 % Fett", ["mit", "milch", "3,5", "%", "fett"]],
    ["Milch 3.5% Fett", ["milch", "3,5", "%", "fett"]],
    ["mind. 45 % Fett i. Tr.", ["mind", "45", "%", "fett", "i", "tr"]],
    ["  ", []],
    // Raw materials write the type into one word: "T550" is "T" and "550".
    ["Weizenmehl T550", ["weizenmehl", "t", "550"]],
    ["25kg", ["25", "kg"]],
  ])("%s", (text, expected) => {
    expect(words(text, german)).toEqual(expected);
  });

  test("a decomposed umlaut reads like a composed one", () => {
    expect(words("Käse", german)).toEqual(["kaese"]);
  });
});

describe("English", () => {
  test.each([
    ["Crème fraîche", ["creme", "fraiche"]],
    ["Rösti", ["rosti"]],
    ["Wheat flour, Type 550", ["wheat", "flour", "type", "550"]],
    // German rules stay German: "Typ" is no "Type" in English.
    ["Typ", ["typ"]],
    ["Milk 3.5% fat", ["milk", "3,5", "%", "fat"]],
  ])("%s", (text, expected) => {
    expect(words(text, english)).toEqual(expected);
  });
});

test("words read back as themselves", () => {
  fc.assert(
    fc.property(fc.string({ unit: "grapheme" }), (text) => {
      for (const language of [german, english]) {
        const once = words(text, language);
        expect(words(once.join(" "), language)).toEqual(once);
      }
    }),
  );
});
