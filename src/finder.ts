import { heads } from "./compounds.ts";
import type { Language } from "./language.ts";
import { type Meanings, readMeanings } from "./meanings.ts";
import {
  ask,
  distance,
  MATCHES,
  type Match,
  partialOf,
  rankOf,
  same,
  type Spelling,
  spell,
} from "./spelling.ts";
import { variants } from "./variants.ts";
import { words } from "./words.ts";

export type { Match };

export type Hit = {
  code: string;
  name: string;
  match: Match;
  /** Found through a meaning, not the name: "Butter" is "Süßrahmbutter". */
  meant: boolean;
  /** The words of the query, as read, that no word of the name holds (`partial` only). */
  missed: string[];
};

export type SearchOptions = {
  /** At most this many hits. */
  limit?: number;
  /** Only foods of this main group, the first letter of the code. */
  group?: string;
};

export type Finder = {
  /**
   * The foods whose name matches `query`, best first. It proposes; picking one stays with a human.
   * Spaces never matter: "Weizenmehl Typ 550" is "Weizen Mehl, Type 550".
   */
  search: (query: string, options?: SearchOptions) => Hit[];
};

export type FinderOptions = {
  /** What everyday words mean, the first source winning a word: `[bakery, meanings]`. */
  meanings?: Meanings[];
};

/** Reads every name once; every search reuses it. `names` is code to name. */
export function createFinder(
  names: Record<string, string>,
  language: Language,
  options: FinderOptions = {},
): Finder {
  const stem = language.stem ?? same;
  const foods = Object.entries(names).map(([code, name]) => ({
    code,
    name,
    spellings: variants(name).map((variant) => spell(words(variant, language), stem)),
  }));
  const byCode = new Map(foods.map((food) => [food.code, food]));
  // Read before the meanings join: compounds are read from the names alone.
  const endsOf = language.compounds && compoundsOf(foods, language.compounds, stem);
  const meant = readMeanings(options.meanings ?? [], language);
  for (const food of foods) {
    for (const { words: read, order } of meant.get(food.code) ?? []) {
      food.spellings.push({ ...spell(read, stem), meant: order });
    }
  }

  function search(query: string, options: SearchOptions = {}): Hit[] {
    const asked = words(query, language);
    const scope = foods.filter(({ code }) => !options.group || code.startsWith(options.group));
    let found = find(asked, scope);
    if (found.length === 0) found = mistyped(asked, scope);
    return found.slice(0, options.limit).map(({ code, name, rank, meant, missed }) => ({
      code,
      name,
      match: MATCHES[rank]!,
      meant: meant !== NOT_MEANT,
      missed,
    }));
  }

  function find(asked: string[], scope: typeof foods): Ranked[] {
    const wanted = asked.join("").length;
    const hits = collect(scope, (spelled) => {
      const rank = rankOf(asked, spelled, endsOf, stem);
      return rank < 0 ? undefined : { rank, covered: wanted, missed: [] };
    }).sort(order);
    // A food with its preparation: what its words mean, so prepared, before names that merely hold
    // both words ("Entenei gekocht" for "Ei gekocht"). A meaning of the whole query comes first.
    const direct = hits.some((hit) => hit.meant !== NOT_MEANT);
    const byPreparation = direct ? [] : prepared(asked, scope);
    const meant = byPreparation.filter((hit) => hit.meant !== NOT_MEANT);
    if (meant.length > 0) return unique([...meant, ...hits]);
    if (hits.length > 0) return hits;
    if (byPreparation.length > 0) return byPreparation;
    return partials(asked, scope).sort(order);
  }

  // Only when nothing is found: every word no name holds read as its nearest known words, one letter
  // off from five letters, two from seven. Short words are never read so ("Eis" is no "Reis").
  function mistyped(asked: string[], scope: typeof foods): Ranked[] {
    const readings = asked.map((word) =>
      vocabulary().has(word) || vocabulary().has(stem(word)) ? [word] : nearest(word),
    );
    if (readings.every((options, index) => options.length === 1 && options[0] === asked[index])) {
      return [];
    }
    const queries = readings.reduce<string[][]>(
      (all, options) =>
        all.flatMap((query) =>
          (options.length > 0 ? options : [""]).map((word) => [...query, word]),
        ),
      [[]],
    );
    return unique(queries.slice(0, 9).flatMap((query) => find(query.filter(Boolean), scope))).map(
      (hit) => ({ ...hit, rank: FUZZY }),
    );
  }

  let known: Set<string> | undefined;
  const vocabulary = () =>
    (known ??= new Set(
      foods.flatMap((food) =>
        food.spellings.flatMap((spelled) => spelled.words.filter((word) => /^\p{L}+$/u.test(word))),
      ),
    ));

  function nearest(word: string): string[] {
    if (word.length < 5 || !/^\p{L}+$/u.test(word)) return [];
    const limit = word.length >= 7 ? 2 : 1;
    let best = limit + 1;
    let found: string[] = [];
    for (const candidate of vocabulary()) {
      const away = distance(word, candidate, Math.min(best, limit));
      if (away < best) {
        best = away;
        found = [candidate];
      } else if (away === best && away <= limit) found.push(candidate);
    }
    return best <= limit ? found.slice(0, 3) : [];
  }

  // Only when no name holds the whole query: a raw material name carries words no name has
  // ("Sack", "lose"). A part that is only the preparation or a short word is no hit: "Aal gedünstet" knows nothing
  // of the food that was asked for.
  function partials(asked: string[], scope: typeof foods): Ranked[] {
    const read = ask(asked, endsOf);
    // Short words ("der", "mit") carry no food either: "Kräuter der Provence" is no "Neuseeländer".
    const food = asked.filter((word) => !isPreparation(word) && word.length >= 4);
    return collect(scope, (spelled) => {
      const partial = partialOf(read, spelled, endsOf, stem);
      if (!partial) return undefined;
      if (food.length > 0 && food.every((word) => partial.missed.includes(word))) return undefined;
      return { rank: PARTIAL, ...partial };
    });
  }

  const order = (a: Ranked, b: Ranked) =>
    better(a, b) || a.name.localeCompare(b.name, language.locale) || a.code.localeCompare(b.code);

  const preparations = new Set(
    (language.preparations ?? []).map((word) => stem(words(word, language).join(""))),
  );
  const dish = language.dish && words(language.dish, language)[0];
  // German adjectives add an ending the stem keeps: "gedünsteter", "gebratenes".
  const isPreparation = (word: string) =>
    preparations.has(stem(word)) || preparations.has(stem(word.replace(/(er|es|em)$/, "")));

  // The food without its preparation, then its variants that have it; without any, the food itself
  // with the preparation missed.
  function prepared(asked: string[], scope: typeof foods): Ranked[] {
    const preparation = asked.filter(isPreparation);
    const food = asked.filter((word) => !isPreparation(word));
    if (preparation.length === 0 || food.length === 0) return [];
    const wanted = food.join("").length;
    const plain = collect(scope, (spelled) => {
      const rank = rankOf(food, spelled, endsOf, stem);
      return rank < 0 ? undefined : { rank, covered: wanted, missed: preparation };
    }).sort(order);
    if (plain.length === 0) return [];
    // What the words mean, or else the best plain hit, stands for the food.
    const meant = plain.filter((hit) => hit.meant !== NOT_MEANT);
    const seeds = meant.length > 0 ? meant : plain.slice(0, 1);
    const core = (code: string) =>
      (byCode.get(code)?.spellings[0]?.words ?? []).filter((word) => !isPreparation(word));
    const variants = seeds.flatMap((seed) => {
      const kernel = core(seed.code);
      return collect(scope, (spelled) => {
        const holds = kernel.every((word) => spelled.words.includes(word));
        // A dish of the food ("Teigwaren mit gedünstetem Gemüse") is no variant of it.
        if (dish !== undefined && spelled.words.includes(dish)) return undefined;
        if (!holds || rankOf(preparation, spelled, endsOf, stem) < 0) return undefined;
        return { rank: seed.rank, covered: asked.join("").length, missed: [] };
      })
        .sort(order)
        .map((variant) => ({ ...variant, meant: seed.meant }));
    });
    return unique([...variants, ...plain.map((hit) => ({ ...hit, rank: PARTIAL }))]);
  }

  return { search };
}

const PARTIAL = MATCHES.indexOf("partial");
const FUZZY = MATCHES.indexOf("fuzzy");

const NOT_MEANT = Infinity;

type Found = { rank: number; covered: number; missed: string[]; meant: number; length: number };

const better = (a: Found, b: Found) =>
  a.rank - b.rank || b.covered - a.covered || a.meant - b.meant || a.length - b.length;

type Ranked = Found & { code: string; name: string };

// Each food once, at its first place.
function unique(hits: Ranked[]): Ranked[] {
  const seen = new Set<string>();
  return hits.filter(({ code }) => !seen.has(code) && seen.add(code));
}

// Each food once, by its best spelling.
function collect(
  foods: { code: string; name: string; spellings: Spelling[] }[],
  read: (spelled: Spelling) => Omit<Found, "meant" | "length"> | undefined,
): (Found & { code: string; name: string })[] {
  return foods.flatMap(({ code, name, spellings }) => {
    const found = spellings
      .flatMap((spelled) => {
        const result = read(spelled);
        if (!result) return [];
        return [{ ...result, meant: spelled.meant ?? NOT_MEANT, length: spelled.whole.length }];
      })
      .sort(better)[0];
    return found ? [{ code, name, ...found }] : [];
  });
}

// A compound ends with a word that stands alone in some name: "Grießbrei" is a "Brei", never an "Ei".
function compoundsOf(
  foods: { spellings: Spelling[] }[],
  rules: NonNullable<Language["compounds"]>,
  stem: (word: string) => string,
): (word: string) => string[] {
  // A word stands alone in its plural too: "Zwiebeln" makes "Speisezwiebel" a "Zwiebel".
  const known = new Set(
    foods.flatMap((food) =>
      food.spellings.flatMap((spelled) => spelled.words.flatMap((word) => [word, stem(word)])),
    ),
  );
  for (const ending of rules.endings) known.add(ending);
  const reading = { known, units: rules.units, found: new Map<string, string[]>() };
  return (word) => heads(word, reading);
}
