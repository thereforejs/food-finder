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
  /**
   * A word without its plural ending, so "Zwiebel" finds "Zwiebeln" and "Tomaten" finds "Tomate".
   * Names keep their words; the stems join them as another way to read.
   */
  stem?: (word: string) => string;
  /**
   * How a food is prepared ("gekocht", "gebraten"). A query with such a word that no name holds
   * whole finds the food without it, then that food's variant with it: "Spaghetti gekocht" is the
   * cooked pasta that "Spaghetti" means, never "Aal gedünstet" for "Nudeln gedünstet".
   */
  preparations?: string[];
  /** The word that makes a name a dish of the food, not a variant of it: "Teigwaren mit Pilzen". */
  dish?: string;
};
