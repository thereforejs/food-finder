# food-finder: specification

Finds foods of [`@thereforejs/foods`](https://github.com/thereforejs/foods) by what people type or
what a raw material is called. foods is the database and ships only the names; the search, the
meanings of everyday words and the rules of each language live here.

**Where this document and the code disagree, this document wins; where it is unsure, it says so.**
Open points are listed in section 10, never guessed.

---

## 1. What it is, and what it is not

**It is** a search over the names of foods: an application creates a finder once per names index and
asks it what a text means. Its first user is a bakery application that creates raw materials and
assigns their nutrient values from foods, directly where the finder is sure, from a short list where
it is not.

**It is not:**

- a database. It ships no foods and no names; the application passes them in;
- a decision. It proposes, best first, and says how each hit matched; picking stays with the
  application or a human;
- tied to foods. Any code with a name can be found: foods' codes, an application's own raw materials.

---

## 2. Principles

- **Lazy loading must not get worse** (section 7). The finder never imports a names index; the
  application loads it and passes it in.
- **One entry point per language.** No module holds a collection of all languages. Languages differ
  and may differ in anything: German needs compounds, English does not; "Butter" may mean one food in
  German and nothing in particular in English.
- **Modules plug in, nothing is chained.** The search works without meanings; meanings are their own
  entry point, maintained as data, and several sources stack.
- **One choke point per rule.** A meaning is matched by the same tiers as a name, never by a second
  search.

---

## 3. API

```ts
import { createFinder } from "@thereforejs/food-finder/de";
import { meanings } from "@thereforejs/food-finder/de/meanings";

const { names } = await import("@thereforejs/foods/names/de");
const finder = createFinder(names, { meanings: [meanings] });

finder.search("Butter", { limit: 5 });
// [{ code: "Q630000", name: "Süßrahmbutter", match: "exact", meant: true, missed: [] }, ...]
```

- `createFinder(names, options?)` reads every name once; every search reuses it. `names` is
  `Record<string, string>`, code to name, as `@thereforejs/foods/names/<lang>` exports it or with the
  application's own entries added.
- `options.meanings`: a list of meaning sources (section 6), first wins.
- `finder.search(query, { limit?, group? })`: the hits, best first. `group` keeps the codes starting
  with it (the BLS main group).
- A hit: `code`, `name`, `match` (the tier, section 4), `meant` (it came through a meaning), `missed`
  (the query words, as read, that the name does not hold; `partial` only, section 4).
- In Vue or Pinia, hold the finder with `markRaw` or `shallowRef`: it holds thousands of prepared
  names that must not become reactive.

---

## 4. Matching

Every name is read into its words (section 5). The BLS slash synonyms are variants of the name:
"Weizenbrot/Weißbrot", "mit Nugat/Nougat/Noisette"; each alternative replaces only its own word, a
shorter group keeps its last alternative.

Tiers, best first. Spaces never matter ("Weizenmehl Typ 550" is "Weizen Mehl, Type 550"):

| Tier       | Holds when                                                                                        | Example                                                                |
| ---------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `exact`    | the whole name                                                                                    | "weizenmehl type 550"                                                  |
| `prefix`   | the start of the name, ending at a word end                                                       | "Weizenmehl" finds "Weizen Mehl, Type 405", never "Weizenmehlschwitze" |
| `words`    | every query word, alone or joined with neighbours, is whole words of the name in a row, any order | "Roggenmehl" is "Roggen Mehl", never part of "Roggen Vollkornmehl"     |
| `compound` | as `words`, a query word may also be the last part of a compound (languages with compounds)       | "Butter" finds "Süßrahmbutter"                                         |
| `partial`  | as `compound`, but some query words are covered by no name word; they are in `missed`             | "Weizenmehl T550 25 kg Sack" finds "Weizen Mehl, Type 550"             |

`partial` serves raw material names: packaging, fat content, suppliers and processing are rarely in a
BLS name ("Weizenmehl Type 550 Sack lose"). It is a fallback: it runs only when no name holds the
whole query, so a search that finds something never changes. In it:

- A word of the query may be found by its last part in languages with compounds: "Rindergelatine"
  finds "Gelatine/Speisegelatine" with `missed: ["rinder"]`. The last part must be at least half
  the word: "Milcheiweiß" is no "Milchei-weiß", "Sauerteig" no "Sandteig". What cannot be told
  apart stays unfound; no exception for single words.
- Letters and digits part ("T550" is "t" and "550"), so the type of a flour still counts.
- The more letters of the query a name holds, the better: "Weizenmehl" and "550" before "Weizenmehl"
  alone. Letters, not words: a longer word carries more meaning than "%" or "25".

Ranking: tier, then more letters of the query found (`partial` only), then meant before not (in the
order of its meaning), then the shorter name, then `localeCompare` in the language of the finder,
then the code.

---

## 5. Languages

Each language is one module with its rules and one entry point that binds them:

- **German** (`/de`): NFC, lowercase in `de-DE`, ß/ä/ö/ü to ss/ae/oe/ue (typed without the keys),
  `typ` read as `type` (the BLS writes "Type 550"), a decimal point reads as a comma ("3.5" is
  "3,5"). Compounds by their last part, with the rules of the old search: the stem needs a vowel
  ("Schwein" is no "Sch-Wein"), units are never split ("Buchweizen" is no "Weizen"), endings that
  never stand alone ("glutenfrei" is "-frei", no "Ei"), a split whose stem is a known word beats
  contradicting readings.
- **English** (`/en`): NFC, lowercase, accents stripped ("crème" is "creme").
- A new language is a new module and entry point; nothing else changes.

---

## 6. Meanings

What people mean by an everyday word: "Butter" is "Süßrahmbutter", "Mehl" is "Weizen Mehl, Type 405".
One file per language, maintained by hand and by contributors, its own entry point:

```ts
// src/de/meanings.ts
export const meanings = {
  Butter: ["Q630000"],
  Mehl: ["C214100"],
} satisfies Meanings;
```

- A key is the word as people write it; it is read with the rules of the language like any name.
- The codes are ordered: the first is what is meant most, the next ones follow.
- A meaning is one more spelling of its foods and goes through the same tiers. It ranks before an
  equal hit without a meaning: "Butter" finds "Süßrahmbutter" before "Butter gesalzen".
- Several sources stack, the first wins: a bakery passes `[bakery, meanings]`, where its `Mehl` is
  Type 550 and ours is Type 405.
- Codes the names do not hold are ignored; an application may pass a filtered index.
- Meanings never change how compounds are read: those are read from the names alone.
- Tests: every code of our files exists in the installed foods, keys are sorted, no two keys read the
  same.

---

## 7. Lazy loading (the acceptance)

foods measured 2026-10-26 with the Vite+ bundler on its built package: an application with one food
is 502 B gzip, the German names are their own lazy chunk of 69.6 KB gzip, no English in it.

The same probe on this package's build, recorded here with its date:

1. An application with the German finder and the names loaded on first use: the finder is small, the
   names are their own chunk, no English rules or meanings in any chunk.
2. Meanings not imported: none in the bundle.
3. Worse numbers than foods' mean not done.

---

## 8. Tests (the oracle)

1. The cases of the old search (`tests/search.test.ts`, `tests/compounds.test.ts`): real BLS names,
   every tier and rule.
2. All 7,108 names of the installed foods: the compound readings, the cases of the old
   `search-data.test.ts`.
3. Raw material names with their expected code, worked out by hand. From the bakery application once
   it has real ones. Real supplier and article data stays out of the repo; cases are written by hand.
4. Properties (fast-check): words read back as themselves; a tier never ranks below a worse one;
   compounds only append after the better tiers; partial hits come only when no name holds the
   whole query.
5. Meanings: section 6.
6. The bundle probe of section 7.

---

## 9. Decisions

- A separate package; foods ships names only (2026-10-26).
- A finder object created once per index, `createFinder(names)`: an application prepares it once, a
  Pinia store holds it (2026-10-29). Replaces the per-index `WeakMap` of the old search.
- Meanings, not aliases: the problem is what an everyday word means, not how a name is spelled
  (2026-10-29). Their own entry point per language, maintained as data, stacked as a list.
- `partial` for raw material names, a fallback only when no name holds the whole query: reading a
  query word by its last part everywhere would make "Roggenmehl" find "Roggen Vollkornmehl"
  (2026-10-29).
- A compound of the query is read by its last part in `partial` ("Rindergelatine" is a "Gelatine"),
  for every language with compounds (2026-10-29).

---

## 10. Open questions

1. **Typos:** Levenshtein 1 for short, 2 for long words as their own lowest tier ("Weizemehl" finds
   "Weizenmehl")?
2. **English:** anything beyond accents?
3. **Peer range:** `^0.0.1` allows only foods 0.0.1.
4. **Root entry point `.`:** types only, or nothing?
5. **Hyphenated words:** joining "Alaska-Seelachs" demoted raw materials in the old search; left out.
