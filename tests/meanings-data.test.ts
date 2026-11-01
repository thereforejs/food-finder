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
    // Words the BLS never uses for the food people mean.
    ["Hühnchen", ["V416100", "V4A6100", "V413000"]],
    ["Knoblauchzehe", ["G490100"]],
    ["Kohl", ["G342100", "G341100", "G343100", "G344100"]],
    ["Pilze", ["K701100", "K750100"]],
    ["Traube", ["F310100", "F311100", "F312100"]],
    ["Trockenhefe", ["R458000"]],
    ["Sirup", ["S151100", "S154000", "S151000"]],
    ["Zwiebel", ["G480100"]],
    ["Balsamico", ["R125000"]],
    ["Ingwerpulver", ["R_000024"]],
    ["Jasminreis", ["C352000"]],
    ["Koriander", ["G_000001", "R_000006"]],
    ["Naturreis", ["C351000"]],
    ["Risottoreis", ["C352000"]],
    ["Salbei getrocknet", ["R_000013"]],
    ["Senfkörner", ["R_000019"]],
    ["Tahini", ["Q901000"]],
    ["Vollkornreis", ["C351000"]],
    ["Zwiebelpulver", ["G480500"]],
    ["Gehackte Tomaten", ["G560900"]],
    ["Kochschinken", ["W424000"]],
    ["Magerquark", ["M713100"]],
    ["Naturjoghurt", ["M141300", "M141200"]],
    ["Rinderhackfleisch", ["U010100"]],
    ["Schweinenacken", ["U632100"]],
    ["Staudensellerie", ["G220100"]],
    ["Vollkornmehl", ["C211000"]],
    ["Zartbitterschokolade", ["S560000"]],
    ["Bier", ["P163000"]],
    ["Brauner Zucker", ["S112000"]],
    ["Brot", ["B251000", "B271000", "B311000"]],
    ["Chili", ["G554100", "G553100"]],
    ["Eiweiß", ["E113100"]],
    ["Erbsen", ["G760200", "G760100"]],
    ["Fenchel", ["G430100"]],
    ["Frischkäse", ["M710800", "M710700"]],
    ["Grieß", ["C219300", "C218000"]],
    ["Grüne Bohnen", ["G710100"]],
    ["Gulasch", ["U151100"]],
    ["Hackfleisch", ["U040100", "U010100", "U020100"]],
    ["Hüttenkäse", ["M711300", "M711100"]],
    ["Joghurt", ["M141300", "M141200", "M141100"]],
    ["Ketchup", ["R141100"]],
    ["Kirsche", ["F211100", "F212100"]],
    ["Kokosraspel", ["H150400"]],
    ["Kresse", ["G280100"]],
    ["Kürbis", ["G581000", "G581100"]],
    ["Melone", ["F533100", "F532100", "F535100"]],
    ["Nudeln", ["E401000", "E432000", "E510000"]],
    ["Paprika", ["G543100", "G542100", "G541100"]],
    ["Petersilie", ["G250100"]],
    ["Reis", ["C352000", "C359000"]],
    ["Rohrzucker", ["S112000"]],
    ["Rote Bete", ["G613100"]],
    ["Rote Linsen", ["H730000"]],
    ["Rotwein", ["P2A3000"]],
    ["Schinken", ["W424000", "W442000"]],
    ["Sellerie", ["G660100", "G220100"]],
    ["Spaghetti", ["E401000"]],
    ["Speck", ["W411300", "W410400"]],
    ["Tee", ["N630000", "N610100"]],
    ["Vollkornnudeln", ["E510000"]],
    ["Weißwein", ["P210000"]],
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
