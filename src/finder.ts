import { heads } from "./compounds.ts";
import type { Language } from "./language.ts";
import { type Meanings, readMeanings } from "./meanings.ts";
import { ask, MATCHES, type Match, partialOf, rankOf, type Spelling, spell } from "./spelling.ts";
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
  const foods = Object.entries(names).map(([code, name]) => ({
    code,
    name,
    spellings: variants(name).map((variant) => spell(words(variant, language))),
  }));
  // Read before the meanings join: compounds are read from the names alone.
  const endsOf = language.compounds && compoundsOf(foods, language.compounds);
  const meant = readMeanings(options.meanings ?? [], language);
  for (const food of foods) {
    for (const { words: read, order } of meant.get(food.code) ?? []) {
      food.spellings.push({ ...spell(read), meant: order });
    }
  }

  function search(query: string, options: SearchOptions = {}): Hit[] {
    const asked = words(query, language);
    const wanted = asked.join("").length;
    const scope = foods.filter(({ code }) => !options.group || code.startsWith(options.group));
    let hits = collect(scope, (spelled) => {
      const rank = rankOf(asked, spelled, endsOf);
      return rank < 0 ? undefined : { rank, covered: wanted, missed: [] };
    });
    // Only when no name holds the whole query: a raw material name carries words no name has
    // ("Sack", "lose"), and a search that finds something stays as it is.
    if (hits.length === 0) {
      const read = ask(asked, endsOf);
      hits = collect(scope, (spelled) => {
        const partial = partialOf(read, spelled, endsOf);
        return partial && { rank: PARTIAL, ...partial };
      });
    }
    hits.sort(
      (a, b) =>
        better(a, b) ||
        a.name.localeCompare(b.name, language.locale) ||
        a.code.localeCompare(b.code),
    );
    return hits.slice(0, options.limit).map(({ code, name, rank, meant, missed }) => ({
      code,
      name,
      match: MATCHES[rank]!,
      meant: meant !== NOT_MEANT,
      missed,
    }));
  }

  return { search };
}

const PARTIAL = MATCHES.indexOf("partial");

const NOT_MEANT = Infinity;

type Found = { rank: number; covered: number; missed: string[]; meant: number; length: number };

const better = (a: Found, b: Found) =>
  a.rank - b.rank || b.covered - a.covered || a.meant - b.meant || a.length - b.length;

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
): (word: string) => string[] {
  const known = new Set(
    foods.flatMap((food) => food.spellings.flatMap((spelled) => spelled.words)),
  );
  for (const ending of rules.endings) known.add(ending);
  const reading = { known, units: rules.units, found: new Map<string, string[]>() };
  return (word) => heads(word, reading);
}
