/** A name read once: its words, joined, where each word ends, and every run of words joined. */
export type Spelling = {
  words: string[];
  whole: string;
  ends: Set<number>;
  spans: Set<string>;
  /** `spans` and what each compound ends with, read on the first query that needs them. */
  compounds?: Set<string>;
};

/**
 * How a hit matched the query, best first: the whole name, its start, its words, or its words with
 * a word of the query as the last part of a compound ("Butter" in "Süßrahmbutter").
 */
export const MATCHES = ["exact", "prefix", "words", "compound"] as const;

export type Match = (typeof MATCHES)[number];

export function spell(words: string[]): Spelling {
  const ends = new Set<number>();
  const spans = new Set<string>();
  let end = 0;
  for (let start = 0; start < words.length; start++) {
    end += words[start]!.length;
    ends.add(end);
    for (let last = start + 1; last <= words.length; last++) {
      spans.add(words.slice(start, last).join(""));
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
): number {
  const wanted = asked.join("");
  if (!wanted) return -1;
  if (name.whole === wanted) return 0;
  // A prefix ends with a word of the name: "Weizenmehl" is "Weizen Mehl, ...", never "Weizenmehlschwitze".
  if (name.ends.has(wanted.length) && name.whole.startsWith(wanted)) return 1;
  if (covers(asked, name.spans)) return 2;
  if (!endsOf) return -1;
  name.compounds ??= new Set([...name.spans, ...name.words.flatMap((word) => endsOf(word))]);
  return covers(asked, name.compounds) ? 3 : -1;
}

// Every word of the query, alone or joined with its neighbours, is one or more whole words of the
// name in a row: "Roggenmehl" is "Roggen Mehl", never a part of "Roggen Vollkornmehl". With
// compounds, it may also be what a compound ends with: "Butter" in "Süßrahmbutter".
function covers(asked: string[], spans: Set<string>): boolean {
  const reached = [true];
  for (let end = 1; end <= asked.length; end++) {
    reached[end] = asked
      .slice(0, end)
      .some((_, start) => reached[start] === true && spans.has(asked.slice(start, end).join("")));
  }
  return reached[asked.length] === true;
}
