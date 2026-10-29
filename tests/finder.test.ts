import { describe, expect, test } from "vite-plus/test";
import { german } from "../src/de/language.ts";
import { english } from "../src/en/language.ts";
import { createFinder, type SearchOptions } from "../src/finder.ts";

// Real BLS 4.0 names.
const names = {
  C213200: "Weizen Mehl, Type 1050",
  C213100: "Weizen Mehl, Type 812",
  C214100: "Weizen Mehl, Type 405",
  C214200: "Weizen Mehl, Type 550",
  C211000: "Weizen Vollkornmehl",
  C223100: "Roggen Mehl, Type 815",
  C221000: "Roggen Vollkornmehl",
  B221000: "Roggenbrot",
  B311000: "Weizenbrot/Weißbrot",
  B309000: "Weißbrot glutenfrei",
  X434442: "Weißbrotwürfel geröstet in Butter (Croutons)",
  B821000: "Paniermehl/Semmelbrösel/Semmelmehl",
  S541600: "Vollmilchschokolade gefüllt mit Nugat/Nougat/Noisette",
  S539000: "Vollmilchschokolade gefüllt mit Mokka-/Kaffeecreme",
  M111300: "Vollmilch frisch, 3,5 % Fett, pasteurisiert",
  M114300: "Vollmilch 3,5 % Fett, laktosefrei, pasteurisiert",
  S539900: "Vollmilchschokolade",
  M021000: "Ziegenmilch mind. 3 % Fett",
  X810123: "Milchreis gesüßt, mit Milch 3,5 % Fett, Zucker und Zimt",
  C551000: "Weizenkleber/Weizengluten",
  Q630000: "Süßrahmbutter",
  Q6A4000: "Butter gesalzen",
  Q530000: "Kakaobutter",
  E111100: "Hühnerei roh",
  X951133: "Grießbrei gesüßt, mit Butter und Ei",
};
const finder = createFinder(names, german);

const codes = (query: string, options?: SearchOptions) =>
  finder.search(query, options).map((hit) => hit.code);
const matched = (query: string) =>
  Object.fromEntries(finder.search(query).map((hit) => [hit.code, hit.match]));

describe("exact", () => {
  test.each([
    ["Weizen Mehl, Type 550", "C214200"],
    ["weizen mehl type 550", "C214200"],
    ["Weizenmehl Typ 550", "C214200"],
    ["Weizen-Mehl 405", undefined],
    ["Weizenbrot/Weissbrot", "B311000"],
    ["weizenbrot weißbrot", "B311000"],
    ["Ziegenmilch mind. 3% Fett", "M021000"],
  ])("%s", (query, code) => {
    const exact = finder.search(query).filter((hit) => hit.match === "exact");
    expect(exact.map((hit) => hit.code)).toEqual(code ? [code] : []);
  });

  test("a hit names the food as written", () => {
    expect(finder.search("weizenbrot weissbrot")).toEqual([
      { code: "B311000", name: "Weizenbrot/Weißbrot", match: "exact" },
    ]);
  });

  test("an empty query finds nothing", () => {
    expect(finder.search(" , ")).toEqual([]);
  });
});

describe("alternatives (the BLS writes synonyms with a slash)", () => {
  test.each([
    ["Weißbrot", "B311000"],
    ["Weizenbrot", "B311000"],
    ["Semmelbrösel", "B821000"],
    ["Semmelmehl", "B821000"],
    ["Weizengluten", "C551000"],
    ["Vollmilchschokolade gefüllt mit Nougat", "S541600"],
    ["Vollmilchschokolade gefüllt mit Kaffeecreme", "S539000"],
  ])("%s is exact", (query, code) => {
    expect(matched(query)[code]).toBe("exact");
  });

  test("a shorter group of alternatives keeps its last one", () => {
    // No BLS name has groups of different sizes yet; a contribution may.
    const name = "Kaffeelikör/Kakaolikör/Schokoladenlikör, cremig, mit Milch/Sahne";
    const liqueur = createFinder({ P5A5000: name }, german);
    expect(liqueur.search("Schokoladenlikör cremig mit Sahne")).toEqual([
      { code: "P5A5000", name, match: "exact" },
    ]);
  });

  test("only the word at the slash is replaced: a filling is no chocolate", () => {
    expect(matched("Nougat")).toEqual({ S541600: "words" });
    expect(matched("Kaffeecreme")).toEqual({ S539000: "words" });
  });
});

describe("prefix", () => {
  test("Weizenmehl finds the wheat flours, best first, not the wholemeal flour", () => {
    expect(codes("Weizenmehl")).toEqual(["C214100", "C214200", "C213100", "C213200"]);
    expect(matched("Weizenmehl")).toEqual({
      C214100: "prefix",
      C214200: "prefix",
      C213100: "prefix",
      C213200: "prefix",
    });
  });

  test("Roggenmehl is not Roggen Vollkornmehl", () => {
    expect(codes("Roggenmehl")).toEqual(["C223100"]);
  });

  test("a prefix ends with a word of the name", () => {
    expect(codes("Weißbrot")).toEqual(["B311000", "B309000"]);
    expect(codes("Weizen")).not.toContain("B311000");
    expect(codes("Roggen")).toEqual(["C223100", "C221000"]);
  });
});

describe("words", () => {
  test("all words of the query in any order, a compound across words of the name", () => {
    expect(matched("Mehl Weizen 550")).toEqual({ C214200: "words" });
    expect(matched("Vollmilch 3,5 % Fett")).toEqual({ M111300: "words", M114300: "prefix" });
    expect(matched("Vollkornmehl Roggen")).toEqual({ C221000: "words" });
    expect(matched("Weizen 405 Mehl")).toEqual({ C214100: "words" });
    expect(matched("Weizenmehl 550")).toEqual({ C214200: "words" });
  });

  test("a word of the query is a whole word of the name, never its start or middle", () => {
    expect(matched("Milch")).toMatchObject({ X810123: "words" });
    expect(codes("Milch")).not.toContain("S539900");
    expect(codes("Vollmilch")).not.toContain("S539900");
  });
});

describe("compound (German: the last part names the kind)", () => {
  test("Butter finds Süßrahmbutter, after the names that say Butter", () => {
    expect(matched("Butter")).toEqual({
      Q6A4000: "prefix",
      X951133: "words",
      X434442: "words",
      Q630000: "compound",
      Q530000: "compound",
    });
    expect(codes("Butter").slice(0, 3)).toEqual(["Q6A4000", "X951133", "X434442"]);
  });

  test("Ei finds Hühnerei", () => {
    expect(matched("Ei")).toMatchObject({ X951133: "words", E111100: "compound" });
  });

  test("a compound and a whole word in one query", () => {
    expect(matched("Ei roh")).toEqual({ E111100: "compound" });
  });

  test("Milch finds Vollmilch and Ziegenmilch, never Vollmilchschokolade", () => {
    expect(matched("Milch")).toMatchObject({
      M111300: "compound",
      M114300: "compound",
      M021000: "compound",
    });
  });

  test("a compound needs more than the query: Roggenmehl is no Roggen Vollkornmehl", () => {
    expect(codes("Roggenmehl")).toEqual(["C223100"]);
    expect(matched("Süßrahmbutter")).toEqual({ Q630000: "exact" });
  });
});

describe("languages", () => {
  const finderEn = createFinder(
    {
      Q530000: "Cocoa butter",
      Q620000: "Cultured butter",
      D3A1000: "Cream éclairs (choux pastry)",
      Q630000: "Sweet cream butter",
      M150000: "Buttermilk",
      M111300: "Whole milk, fresh, 3.5 % fat, pasteurised",
    },
    english,
  );

  test("English is read without accents", () => {
    expect(finderEn.search("cream eclairs").map((hit) => hit.code)).toEqual(["D3A1000"]);
  });

  test("English writes the kind as its own word: buttermilk is no milk", () => {
    expect(finderEn.search("butter").map((hit) => hit.match)).toEqual(["words", "words", "words"]);
    expect(finderEn.search("milk").map((hit) => hit.code)).toEqual(["M111300"]);
  });
});

describe("ranking and options", () => {
  test("exact before prefix before words", () => {
    expect(finder.search("Vollmilch 3,5 % Fett").map((hit) => hit.match)).toEqual([
      "prefix",
      "words",
    ]);
    expect(codes("Weißbrot")[0]).toBe("B311000");
  });

  test("the shorter name first, then the language's alphabet", () => {
    const sorted = createFinder({ C: "Zwiebeln roh", B: "Birnen roh", A: "Äpfel roh" }, german);
    // "aepfelroh" and "birnenroh" are equally long; de-DE sorts Ä with A, code points after Z.
    expect(sorted.search("roh").map((hit) => hit.code)).toEqual(["A", "B", "C"]);
  });

  test("limit", () => {
    expect(codes("Weizenmehl", { limit: 2 })).toEqual(["C214100", "C214200"]);
  });

  test("group is the first letter of the code", () => {
    expect(codes("Fett", { group: "M" })).toEqual(["M021000", "M111300", "M114300"]);
    expect(codes("Fett", { group: "X" })).toEqual(["X810123"]);
  });
});
