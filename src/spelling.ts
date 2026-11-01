/** A name read once: its words, joined, where each word ends, and every run of words joined. */
export type Spelling = {
  words: string[];
  whole: string;
  ends: Set<number>;
  spans: Set<string>;
  /** `spans` and what each compound ends with, read on the first query that needs them. */
  compounds?: Set<string>;
  /** A word of a meaning, not the name: the place of the food in it. */
  meant?: number;
};

/**
 * How a hit matched the query, best first: the whole name, its start, its words, its words with a
 * word of the query as the last part of a compound ("Butter" in "Süßrahmbutter"), some words of the
 * query only, or, when nothing else is found, a mistyped word read as the nearest known one.
 */
export const MATCHES = ["exact", "prefix", "words", "compound", "partial", "fuzzy"] as const;

export type Match = (typeof MATCHES)[number];

/** A word as it is: for languages without a `stem`. */
export const same = (word: string) => word;

export function spell(words: string[], stem: (word: string) => string = same): Spelling {
  const ends = new Set<number>();
  const spans = new Set<string>();
  let end = 0;
  for (let start = 0; start < words.length; start++) {
    end += words[start]!.length;
    ends.add(end);
    for (let last = start + 1; last <= words.length; last++) {
      const span = words.slice(start, last).join("");
      spans.add(span);
      spans.add(stem(span));
    }
  }
  return { words, whole: words.join(""), ends, spans };
}

/**
 * The index of the match in `MATCHES`, -1 for none. `endsOf` gives the words a word of a name ends
 * with, if the language builds compounds.
 */
export function rankOf(
  asked: string[],
  name: Spelling,
  endsOf?: (word: string) => string[],
  stem: (word: string) => string = same,
): number {
  const wanted = asked.join("");
  if (!wanted) return -1;
  if (name.whole === wanted) return 0;
  // A prefix ends with a word of the name: "Weizenmehl" is "Weizen Mehl, ...", never "Weizenmehlschwitze".
  if (name.ends.has(wanted.length) && name.whole.startsWith(wanted)) return 1;
  if (startsAsStem(asked, name, stem)) return 1;
  if (covers(asked, name.spans, stem)) return 2;
  if (!endsOf) return -1;
  return covers(asked, piecesOf(name, endsOf, stem), stem) ? 3 : -1;
}

// Singular and plural start a name alike, word by word or as one: "Kartoffeln geschält" starts
// "Kartoffel geschält, roh", "Erdbeeren" starts "Erdbeere roh".
function startsAsStem(asked: string[], name: Spelling, stem: (word: string) => string): boolean {
  const wanted = asked.join("");
  const whole = stem(wanted);
  const byWord = asked.map(stem).join("");
  let lead = "";
  let leadByWord = "";
  for (const word of name.words) {
    lead += word;
    leadByWord += stem(word);
    if (lead.length > wanted.length + 2) return false;
    if (stem(lead) === whole || leadByWord === byWord) return true;
  }
  return false;
}

export type Partial = { covered: number; missed: string[] };

/** A query read once for `partialOf`: every run of its words joined, and what each word ends with. */
export type Asked = { words: string[]; runs: string[][]; tails: string[][] };

export function ask(words: string[], endsOf?: (word: string) => string[]): Asked {
  return {
    words,
    runs: words.map((_, end) => words.map((_, start) => words.slice(start, end + 1).join(""))),
    tails: words.map((word) => endsOf?.(word) ?? []),
  };
}

/**
 * How much of the query a name holds when it does not hold all of it: the letters found, and the
 * words missed. A word of the query may be found by its last part: "Rindergelatine" is a
 * "Gelatine" with "rinder" missed. Longer words carry more meaning, so letters count, not words.
 */
export function partialOf(
  asked: Asked,
  name: Spelling,
  endsOf?: (word: string) => string[],
  stem: (word: string) => string = same,
): Partial | undefined {
  const pieces = piecesOf(name, endsOf, stem);
  const best: Partial[] = [{ covered: 0, missed: [] }];
  for (let end = 1; end <= asked.words.length; end++) {
    const word = asked.words[end - 1]!;
    const before = best[end - 1]!;
    const options = [{ covered: before.covered, missed: [...before.missed, word] }];
    for (let start = 0; start < end; start++) {
      const run = asked.runs[end - 1]![start]!;
      if (!pieces.has(run) && !pieces.has(stem(run))) continue;
      options.push({ covered: best[start]!.covered + run.length, missed: best[start]!.missed });
    }
    for (const tail of asked.tails[end - 1]!) {
      // A short last part misreads too often: "Milcheiweiß" is no "Milchei-weiß", "Sauerteig" no
      // "Sandteig". What cannot be told apart stays unfound.
      if (!pieces.has(tail) || tail.length * 2 < word.length) continue;
      const stem = word.slice(0, -tail.length);
      options.push({ covered: before.covered + tail.length, missed: [...before.missed, stem] });
    }
    best[end] = options.reduce((a, b) => (b.covered > a.covered ? b : a));
  }
  const found = best[asked.words.length]!;
  return found.covered > 0 ? found : undefined;
}

// What a word of the query may be in this name: its runs of words, and with compounds what each
// word ends with.
function piecesOf(
  name: Spelling,
  endsOf?: (word: string) => string[],
  stem: (word: string) => string = same,
): Set<string> {
  if (!endsOf) return name.spans;
  name.compounds ??= new Set([
    ...name.spans,
    ...name.words.flatMap((word) => endsOf(word).flatMap((head) => [head, stem(head)])),
  ]);
  return name.compounds;
}

// Every word of the query, alone or joined with its neighbours, is one or more whole words of the
// name in a row: "Roggenmehl" is "Roggen Mehl", never a part of "Roggen Vollkornmehl". With
// compounds, it may also be what a compound ends with: "Butter" in "Süßrahmbutter".
function covers(asked: string[], spans: Set<string>, stem: (word: string) => string): boolean {
  const reached = [true];
  for (let end = 1; end <= asked.length; end++) {
    reached[end] = asked.slice(0, end).some((_, start) => {
      if (reached[start] !== true) return false;
      const run = asked.slice(start, end).join("");
      return spans.has(run) || spans.has(stem(run));
    });
  }
  return reached[asked.length] === true;
}

/**
 * Letters to change, add, drop or swap with a neighbour to turn `a` into `b`; `limit + 1` as soon as
 * it is clear that more than `limit` are needed.
 */
export function distance(a: string, b: string, limit: number): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let before: number[] = [];
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let smallest = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(previous[j]! + 1, current[j - 1]! + 1, previous[j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, before[j - 2]! + 1);
      }
      current[j] = value;
      smallest = Math.min(smallest, value);
    }
    if (smallest > limit) return limit + 1;
    before = previous;
    previous = current;
  }
  return Math.min(previous[b.length]!, limit + 1);
}
