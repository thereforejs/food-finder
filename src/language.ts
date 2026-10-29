/** The rules of one language for reading names and queries. */
export type Language = {
  locale: string;
  /** How people type the letters of the language without its special keys. */
  spell: (text: string) => string;
  /** Words written two ways, read as the second. */
  same: Map<string, string>;
};
