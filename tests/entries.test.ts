import { expect, test } from "vite-plus/test";
import { createFinder as createGerman } from "../src/de/index.ts";
import { meanings as german } from "../src/de/meanings.ts";
import { createFinder as createEnglish } from "../src/en/index.ts";
import { meanings as english } from "../src/en/meanings.ts";

test("/de binds German: its spellings, compounds and meanings", () => {
  const finder = createGerman(
    { Q630000: "Süßrahmbutter", Q6A4000: "Butter gesalzen", C214200: "Weizen Mehl, Type 550" },
    { meanings: [german] },
  );
  expect(finder.search("Butter")[0]).toMatchObject({ code: "Q630000", meant: true });
  expect(finder.search("Weizenmehl Typ 550")[0]).toMatchObject({ code: "C214200", match: "exact" });
});

test("/de works without meanings", () => {
  const finder = createGerman({ Q630000: "Süßrahmbutter", Q6A4000: "Butter gesalzen" });
  expect(finder.search("Butter").map((hit) => hit.match)).toEqual(["prefix", "compound"]);
});

test("/en binds English: no compounds, its own meanings", () => {
  const finder = createEnglish(
    { M111300: "Whole milk, fresh, 3.5 % fat, pasteurised", M150000: "Buttermilk" },
    { meanings: [english] },
  );
  expect(finder.search("milk").map((hit) => hit.code)).toEqual(["M111300"]);
  expect(finder.search("Crème")).toEqual([]);
});
