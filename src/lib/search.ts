import { normalizeLatinDigits } from "@/lib/digits";

/**
 * Length-preserving fold: unifies Arabic letter variants and letter case without
 * adding or removing characters, so match offsets still line up with the original
 * string (needed to highlight the matched part of a label).
 */
export function foldSearchText(value: string): string {
  return normalizeLatinDigits(value ?? "")
    .toLowerCase()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي");
}

/** Full normalization for matching: folds letters, then drops diacritics and tatweel. */
export function normalizeSearchText(value: string): string {
  return foldSearchText(value)
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchTokens(value: string): string[] {
  return normalizeSearchText(value).split(" ").filter(Boolean);
}

/**
 * Customers type the colloquial Iraqi term while the catalogue stores the formal
 * one ("انفرتر" vs "عاكس", "سويج" vs "سويتش"), so each term also matches its siblings.
 */
const SYNONYM_GROUPS = [
  ["انفرتر", "عاكس", "عواكس", "inverter"],
  ["سويج", "سويتج", "سويتش", "switch"],
  ["بانل", "لوح", "الواح", "panel"],
  ["راوتر", "موجه", "router"],
  ["بطاريه", "بطاريات", "battery"],
  ["كيبل", "كابل", "cable"],
  ["شاحن", "شاحنه", "charger"],
  ["مجهز", "باور سبلاي", "power supply"],
].map((group) => group.map(normalizeSearchText));

/** Below this length a token is too generic to safely pull in synonyms. */
const MIN_SYNONYM_TOKEN = 3;

/** Turns each token into the list of spellings that should satisfy it. */
export function expandTokens(tokens: string[]): string[][] {
  return tokens.map((token) => {
    if (token.length < MIN_SYNONYM_TOKEN) return [token];
    const alternatives = new Set([token]);
    for (const group of SYNONYM_GROUPS) {
      if (group.some((term) => term.includes(token) || token.includes(term))) {
        group.forEach((term) => alternatives.add(term));
      }
    }
    return [...alternatives];
  });
}

/** True when every token (or one of its synonyms) appears in the normalized haystack. */
export function matchesAllTokens(normalizedHaystack: string, expandedTokens: string[][]): boolean {
  return expandedTokens.every((alternatives) =>
    alternatives.some((alt) => normalizedHaystack.includes(alt))
  );
}
