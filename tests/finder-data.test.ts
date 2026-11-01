import { names } from "@thereforejs/foods/names/de";
import { names as englishNames } from "@thereforejs/foods/names/en";
import fc from "fast-check";
import { describe, expect, test } from "vite-plus/test";
import { german } from "../src/de/language.ts";
import { english } from "../src/en/language.ts";
import { createFinder } from "../src/finder.ts";
import { words } from "../src/words.ts";

// Compounds are read against every name of the installed foods.
const finder = createFinder(names, german);
const codes = (query: string) => finder.search(query).map((hit) => hit.code);

describe("German compounds on the BLS names", () => {
  test.each([
    ["Ei", "E111100", "Hühnerei roh"],
    ["Butter", "Q630000", "Süßrahmbutter"],
    ["Brot", "B121000", "Roggenvollkornbrot"],
    ["Wein", "P281000", "Glühwein"],
    ["Eis", "Y996510", "Erdbeereis"],
    ["Milchschokolade", "S539900", "Vollmilchschokolade"],
    ["Sahnetorte", "D312800", "Mokkasahnetorte (Wasserbiskuit) mit Alkohol"],
  ])("%s finds %s %s", (query, code) => {
    expect(codes(query)).toContain(code);
  });

  test.each([
    ["Ei", "B309000", "Weißbrot glutenfrei: -frei"],
    ["Ei", "X951113", "Grießbrei einfach, gesüßt: a Brei"],
    ["Wein", "V250100", "Wildschwein Fleisch, roh: no Sch-Wein"],
    ["Reis", "Y996510", "Erdbeereis: Erdbeer-Eis"],
    ["Weizenbrot", "B8A3000", "Buchweizenbrot glutenfrei: Buchweizen is no Weizen"],
    ["Roggenmehl", "C221000", "Roggen Vollkornmehl"],
    ["Weizenmehl", "C211000", "Weizen Vollkornmehl"],
  ])("%s never finds %s %s", (query, code) => {
    expect(codes(query)).not.toContain(code);
  });

  test("Weizenmehl finds the five wheat flours first", () => {
    expect(codes("Weizenmehl").slice(0, 5)).toEqual([
      "C214100",
      "C214200",
      "C213100",
      "C213200",
      "C213500",
    ]);
  });
});

describe("German singular and plural on the BLS names", () => {
  // People type one onion; the BLS writes "Speisezwiebel" and "Zwiebeln gebraten".
  test.each([
    ["Zwiebel", "G480100", "Speisezwiebel roh"],
    ["Zwiebel", "X548163", "Zwiebeln gebraten"],
    ["Olive", "H510802", "Oliven grün, gesäuert, abgetropft"],
    ["Nudel", "C559000", "Reisnudeln roh"],
    ["Schalotten", "G485100", "Schalotte roh"],
    ["Paprikaschote", "X553712", "Paprikaschoten gebacken, mit Bulgur-Gemüsefüllung"],
    ["Garnelen", "T753100", "Garnele/Granat/Krabbe, roh"],
    ["Tomaten", "G561100", "Tomate roh"],
    ["Kartoffeln", "K110100", "Kartoffel geschält, roh"],
  ])("%s finds %s %s", (query, code) => {
    expect(codes(query)).toContain(code);
  });

  // The plain food leads a dish whose name merely starts with the plural.
  test.each([
    ["Erdbeeren", "F301100", "Erdbeere roh"],
    ["Linsen", "H725100", "Linse reif"],
    ["Kichererbsen", "G770400", "Kichererbse reif"],
    ["Champignons", "K701100", "Champignon roh"],
    ["Haselnüsse", "H130100", "Haselnuss"],
    ["Walnüsse", "H120100", "Walnuss"],
    ["Äpfel", "F110100", "Apfel roh"],
  ])("%s leads with %s %s", (query, code) => {
    expect(codes(query)[0]).toBe(code);
  });

  // An ending is a whole word's ending: a word still never matches the start of a longer one.
  test.each([["Zwiebel", "D096000", "Zwiebelkuchen mit Speck (Hefeteig)"]])(
    "%s never finds %s %s",
    (query, code) => {
      expect(codes(query)).not.toContain(code);
    },
  );
});

describe("German spellings on the BLS names", () => {
  test.each([
    ["Crème fraîche", "M176800", "Sauerrahm/Creme fraiche, 30 % Fett"],
    ["Brokkoli", "G312100", "Broccoli roh"],
  ])("%s finds %s %s", (query, code) => {
    expect(codes(query)).toContain(code);
  });
});

test("compounds only add hits after all others, never drop or move one", () => {
  const plain = createFinder(names, { ...german, compounds: undefined });
  const vocabulary = [...new Set(Object.values(names).flatMap((name) => words(name, german)))];
  fc.assert(
    fc.property(fc.constantFrom(...vocabulary.sort()), (query) => {
      const before = plain.search(query);
      const after = finder.search(query);
      expect(after.slice(0, before.length)).toEqual(before);
      expect(after.slice(before.length).every((hit) => hit.match === "compound")).toBe(true);
    }),
    { numRuns: 30 },
  );
});

describe("English plurals on the BLS names", () => {
  const en = createFinder(englishNames, english);
  test.each([
    ["Shallots", "G485100", "Shallot raw"],
    ["Grapes", "F310100", "Grape raw"],
  ])("%s finds %s %s", (query, code) => {
    expect(en.search(query).map((hit) => hit.code)).toContain(code);
  });
});

describe("raw material names on the BLS names", () => {
  test.each([
    ["Weizenmehl Type 550 Sack lose", "C214200", "Weizen Mehl, Type 550"],
    ["Weizenmehl T550 25 kg Sack", "C214200", "Weizen Mehl, Type 550"],
    ["Rindergelatine", "R468000", "Gelatine/Speisegelatine"],
    ["modifizierte Kartoffelstärke", "K230000", "Kartoffelstärke (Kartoffelmehl)"],
  ])("%s finds %s %s first", (query, code) => {
    expect(codes(query)[0]).toBe(code);
  });

  // The last part of a query word counts only when it is at least half of it.
  test.each([
    ["Milcheiweiß", "W245000", "Lyoner weiß: no Milchei-weiß"],
    ["Sauerteig", "D421000", "Sandmasse/Sandteig, roh"],
    ["Hühnervolleipulver", "R421100", "Backpulver"],
  ])("%s never finds %s %s", (query, code) => {
    expect(codes(query)).not.toContain(code);
  });
});

test("partial hits come only when no name holds the whole query", () => {
  const vocabulary = [...new Set(Object.values(names).flatMap((name) => words(name, german)))];
  fc.assert(
    fc.property(
      fc.constantFrom(...vocabulary.sort()),
      fc.string({ minLength: 1 }),
      (word, other) => {
        expect(finder.search(word).some((hit) => hit.match === "partial")).toBe(false);
        const hits = finder.search(`${word} ${other}`);
        const partial = hits.filter((hit) => hit.match === "partial");
        expect(partial.length === 0 || partial.length === hits.length).toBe(true);
      },
    ),
    { numRuns: 30 },
  );
});
