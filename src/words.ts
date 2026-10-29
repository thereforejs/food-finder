import type { Language } from "./language.ts";

/** The words of a name or a query as they are compared; a decimal point reads as a comma. */
export function words(text: string, language: Language): string[] {
  const spelled = language.spell(text.normalize("NFC").toLocaleLowerCase(language.locale));
  return (spelled.match(/\d+(?:[.,]\d+)?|[\p{L}\p{N}]+|%/gu) ?? []).map(
    (word) => language.same.get(word) ?? word.replace(".", ","),
  );
}
