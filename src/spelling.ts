/** A name read once: its words, joined, where each word ends, and every run of words joined. */
export type Spelling = {
  words: string[];
  whole: string;
  ends: Set<number>;
  spans: Set<string>;
};

/** How a hit matched the query, best first. */
export const MATCHES = ["exact", "prefix", "words"] as const;

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

/** The index of the match in `MATCHES`, -1 for none. */
export function rankOf(asked: string[], name: Spelling): number {
  const wanted = asked.join("");
  if (!wanted) return -1;
  if (name.whole === wanted) return 0;
  // A prefix ends with a word of the name: "Weizenmehl" is "Weizen Mehl, ...", never "Weizenmehlschwitze".
  if (name.ends.has(wanted.length) && name.whole.startsWith(wanted)) return 1;
  return covers(asked, name.spans) ? 2 : -1;
}

// Every word of the query, alone or joined with its neighbours, is one or more whole words of the
// name in a row: "Roggenmehl" is "Roggen Mehl", never a part of "Roggen Vollkornmehl".
function covers(asked: string[], spans: Set<string>): boolean {
  const reached = [true];
  for (let end = 1; end <= asked.length; end++) {
    reached[end] = asked
      .slice(0, end)
      .some((_, start) => reached[start] === true && spans.has(asked.slice(start, end).join("")));
  }
  return reached[asked.length] === true;
}
