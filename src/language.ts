/** The rules of one language for reading names and queries. */
export type Language = {
  locale: string;
  /** How people type the letters of the language without its special keys. */
  spell: (text: string) => string;
  /** Words written two ways, read as the second. */
  same: Map<string, string>;
  /**
   * The last part of a compound is its kind: "Süßrahmbutter" is a butter. `endings` end compounds
   * without ever standing alone ("glutenfrei" is "-frei", never an "Ei"); `units` are never split
   * ("Buchweizen" is no "Weizen"). Without it, the language writes the kind as its own word.
   */
  compounds?: { endings: string[]; units: string[] };
};
