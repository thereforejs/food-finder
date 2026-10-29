const ALTERNATIVES = /[^\s,()/]*\/[^\s,()]*/g;

/**
 * A name and its spellings with the BLS slash synonyms, "Weizenbrot/Weißbrot", "mit
 * Nugat/Nougat/Noisette": each alternative replaces only its own word, a shorter group keeps its
 * last alternative.
 */
export function variants(name: string): string[] {
  const groups = name.match(ALTERNATIVES) ?? [];
  const count = Math.max(0, ...groups.map((group) => group.split("/").length));
  return [
    name,
    ...Array.from({ length: count }, (_, index) =>
      name.replace(ALTERNATIVES, (group) => {
        const alternatives = group.split("/");
        return alternatives[Math.min(index, alternatives.length - 1)]!;
      }),
    ),
  ];
}
