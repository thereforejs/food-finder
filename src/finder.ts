import { heads } from "./compounds.ts";
import type { Language } from "./language.ts";
import { MATCHES, type Match, rankOf, type Spelling, spell } from "./spelling.ts";
import { variants } from "./variants.ts";
import { words } from "./words.ts";

export type { Match };

export type Hit = { code: string; name: string; match: Match };

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

/** Reads every name once; every search reuses it. `names` is code to name. */
export function createFinder(names: Record<string, string>, language: Language): Finder {
  const foods = Object.entries(names).map(([code, name]) => ({
    code,
    name,
    spellings: variants(name).map((variant) => spell(words(variant, language))),
  }));
  const endsOf = language.compounds && compoundsOf(foods, language.compounds);

  function search(query: string, options: SearchOptions = {}): Hit[] {
    const asked = words(query, language);
    const hits: (Hit & { rank: number; length: number })[] = [];
    for (const { code, name, spellings } of foods) {
      if (options.group && !code.startsWith(options.group)) continue;
      const found = spellings
        .map((spelled) => ({ rank: rankOf(asked, spelled, endsOf), length: spelled.whole.length }))
        .filter(({ rank }) => rank >= 0)
        .sort((a, b) => a.rank - b.rank || a.length - b.length)[0];
      if (found) hits.push({ code, name, match: MATCHES[found.rank]!, ...found });
    }
    hits.sort(
      (a, b) =>
        a.rank - b.rank ||
        a.length - b.length ||
        a.name.localeCompare(b.name, language.locale) ||
        a.code.localeCompare(b.code),
    );
    return hits.slice(0, options.limit).map(({ code, name, match }) => ({ code, name, match }));
  }

  return { search };
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
