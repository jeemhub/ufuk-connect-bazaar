import { describe, it, expect } from "vitest";
import { expandTokens, foldSearchText, matchesAllTokens, normalizeSearchText, searchTokens } from "@/lib/search";

const matches = (haystack: string, query: string) =>
  matchesAllTokens(normalizeSearchText(haystack), expandTokens(searchTokens(query)));

describe("normalizeSearchText", () => {
  it("folds alef, ya and ta-marbuta variants", () => {
    expect(normalizeSearchText("إنفرتر")).toBe(normalizeSearchText("انفرتر"));
    expect(normalizeSearchText("بطارية")).toBe(normalizeSearchText("بطاريه"));
    expect(normalizeSearchText("مصطفى")).toBe(normalizeSearchText("مصطفي"));
  });

  it("drops diacritics, tatweel and extra spacing", () => {
    expect(normalizeSearchText("رَاوـتـر  شبكة")).toBe("راوتر شبكه");
  });

  it("converts Arabic-Indic digits", () => {
    expect(normalizeSearchText("١٢ فولت")).toBe("12 فولت");
  });
});

describe("foldSearchText", () => {
  it("preserves length so highlight offsets stay valid", () => {
    const text = "بطارية جل ١٢ فولت";
    expect(foldSearchText(text)).toHaveLength(text.length);
  });
});

describe("matchesAllTokens", () => {
  it("requires every token to be present", () => {
    expect(matches("راوتر ميكروتك RB5009", "راوتر ميكروتك")).toBe(true);
    expect(matches("راوتر ميكروتك RB5009", "راوتر هواوي")).toBe(false);
  });

  it("matches colloquial terms against the catalogue wording", () => {
    expect(matches("عاكس كهرباء MUST 6KW PRO", "انفرتر")).toBe(true);
    expect(matches("سويتش Ruijie 24 بورت", "سويج")).toBe(true);
    expect(matches("ألواح شمسية 645 واط", "بانل")).toBe(true);
  });

  it("does not pull in synonyms for very short tokens", () => {
    expect(expandTokens(["عا"])).toEqual([["عا"]]);
  });
});
