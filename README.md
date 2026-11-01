<h1 align="center">food-finder</h1>

<p align="center">
  Find foods of <a href="https://github.com/thereforejs/foods"><code>@thereforejs/foods</code></a> by what people type<br>
  or what a supplier calls a raw material. Best first, and it says how each hit matched.
</p>

"Butter" finds Süßrahmbutter, "Weizenmehl Typ 550" finds "Weizen Mehl, Type 550", and "Weizenmehl
T550 25 kg Sack" still finds it, with the words it could not place.

> [!WARNING]
> Early development (0.x). The API may still change.

## Install

```sh
npm install @thereforejs/food-finder @thereforejs/foods
```

## Use

Create a finder once per language and search it often. The names come from foods; load them when
you need them:

```ts
import { createFinder } from "@thereforejs/food-finder/de";
import { meanings } from "@thereforejs/food-finder/de/meanings";

const { names } = await import("@thereforejs/foods/names/de");
const finder = createFinder(names, { meanings: [meanings] });

finder.search("Butter", { limit: 3 });
```

You get:

```ts
[
  { code: "Q630000", name: "Süßrahmbutter", match: "exact", meant: true, missed: [] },
  { code: "Q6A4000", name: "Butter gesalzen", match: "prefix", meant: false, missed: [] },
  { code: "Q611000", name: "Butter mild gesäuert", match: "prefix", meant: false, missed: [] },
];
```

- **`match`**: how the hit matched, best first:
  - `exact`: the whole name. Spaces never matter: "Weizenmehl Typ 550" is "Weizen Mehl, Type 550".
  - `prefix`: the start of the name, ending at a word: "Weizenmehl" finds "Weizen Mehl, Type 405",
    never "Weizenmehlschwitze".
  - `words`: every word of the query is a whole word of the name, any order. Singular and plural
    are one word: "Zwiebel" finds "Zwiebeln gebraten", "Tomaten" finds "Tomate roh".
  - `compound`: a word of the query is the last part of a compound: "Butter" finds "Kakaobutter".
  - `partial`: only when no name holds the whole query, the names that hold the most of it.
- **`meant`**: found through a meaning (below), not the name.
- **`missed`**: the words of the query, as read, that the name does not hold (`partial` only).

Options of `search`: `limit` (at most this many hits) and `group` (only codes starting with it, the
main group of the BLS).

In Vue or Pinia, keep the finder out of reactivity. It holds every name prepared for searching:

```ts
const finder = markRaw(createFinder(names, { meanings: [meanings] }));
```

## Raw materials

Suppliers add packaging, types and brands that no food name has. When nothing holds the whole query,
the finder proposes the names that hold the most of it:

```ts
finder.search("Weizenmehl T550 25 kg Sack")[0];
// { code: "C214200", name: "Weizen Mehl, Type 550", match: "partial", meant: false,
//   missed: ["t", "25", "kg", "sack"] }

finder.search("Rindergelatine")[0];
// { code: "R468000", name: "Gelatine/Speisegelatine", match: "partial", meant: false,
//   missed: ["rinder"] }
```

What cannot be told apart stays unfound: "Milcheiweiß" finds no "Lyoner weiß".

**Assign directly** when the first hit is `exact` and no other hit is. Anything else is a proposal: let
a human pick.

## Meanings

What people mean by an everyday word: "Butter" is "Süßrahmbutter", "Milch" is "Vollmilch frisch,
3,5 % Fett". A word that is undefined on its own means several foods, so a human picks: "Mehl" is
every typed flour of wheat, rye and spelt.

Pass your own before ours; the first source wins a word:

```ts
const bakery = { Mehl: ["C214200"] }; // in this bakery, "Mehl" is Type 550
const finder = createFinder(names, { meanings: [bakery, meanings] });
```

A meaning may name any code the names hold, your own raw materials too:

```ts
const finder = createFinder(
  { ...names, "own:42": "Roggenmischung nach Hausrezept" },
  { meanings: [{ Hausmischung: ["own:42"] }, meanings] },
);
```

## Languages

One entry point per language, so a German application holds no English:

| Import                               | Reads                                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `@thereforejs/food-finder/de`        | German: ß/ä/ö/ü typed as ss/ae/oe/ue, other accents dropped, "Typ" as "Type", plurals, compounds |
| `@thereforejs/food-finder/en`        | English: accents typed without them, plurals                                                     |
| `.../de/meanings`, `.../en/meanings` | the meanings of each language, only when you import them                                         |

## Size

Measured 2026-10-29, an application built with the Vite+ bundler, minified, gzip:

| Application              | App part | Names, loaded on first use |
| ------------------------ | -------- | -------------------------- |
| `/de`                    | 2,255 B  | 69,641 B                   |
| `/de` and `/de/meanings` | 2,390 B  | 69,641 B                   |
| `/en`                    | 2,173 B  | 67,923 B                   |

On the 7,108 German names, `createFinder` takes about 65 ms and a search about 10 to 40 ms.

## License

[MIT](./LICENSE)
