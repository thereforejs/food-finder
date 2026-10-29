export type Reading = {
  /** The words that stand alone somewhere: "Grießbrei" is a "Brei", never an "Ei". */
  known: Set<string>;
  /** Words never split: "Buchweizenbrot" is no "Weizenbrot". */
  units: string[];
  /** Every word once read. */
  found: Map<string, string[]>;
};

/**
 * The words a German compound ends with: "Roggenvollkornbrot" is a "Vollkornbrot" and a "Brot".
 */
export function heads(word: string, reading: Reading): string[] {
  const { known, units, found } = reading;
  const cached = found.get(word);
  if (cached) return cached;
  const candidates: { head: string; sure: boolean }[] = [];
  for (let cut = 2; cut < word.length - 1; cut++) {
    const stem = word.slice(0, cut);
    const head = word.slice(cut);
    // A stem is a syllable at least: "Schwein" is no "Sch-Wein".
    if (!known.has(head) || !/[aeiouy]/.test(stem)) continue;
    if (units.some((unit) => splits(word, unit, cut))) continue;
    candidates.push({ head, sure: known.has(stem) });
  }
  // A split is sure when its stem is a word too. Without one, the longest reading leads. A head
  // that contradicts the lead is a misreading: "Erdbee-Reis" against "Erdbeer-Eis", "Glutenfr-Ei"
  // against "Gluten-frei"; "Milchschokolade" agrees with "Vollmilch-Schokolade".
  const sure = candidates.filter((candidate) => candidate.sure);
  const leads = sure.length > 0 ? sure : candidates.slice(0, 1);
  const result = candidates
    .map(({ head }) => head)
    .filter((head) =>
      leads.every(
        (lead) =>
          lead.head === head ||
          (lead.head.length > head.length
            ? heads(lead.head, reading).includes(head)
            : heads(head, reading).includes(lead.head)),
      ),
    );
  found.set(word, result);
  return result;
}

// Whether `cut` falls inside an occurrence of `unit`; a cut at its start or end leaves it whole.
function splits(word: string, unit: string, cut: number): boolean {
  return word.slice(Math.max(0, cut - unit.length + 1), cut + unit.length - 1).includes(unit);
}
