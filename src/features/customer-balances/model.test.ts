import { describe, expect, it } from "vitest";

import {
  formatBalanceAmount,
  getPageCount,
  normalizeBalanceSearch,
} from "./model";

describe("customer balance model", () => {
  it("normalizes whitespace and English letter case without changing Arabic text", () => {
    expect(normalizeBalanceSearch("  Ecolog   شركة ")).toBe("ecolog شركة");
  });

  it("formats exact decimal strings with thousands separators", () => {
    expect(formatBalanceAmount("1234567.125")).toBe("1,234,567.125");
    expect(formatBalanceAmount("-1200.50")).toBe("-1,200.50");
  });

  it("displays zero and blank values as an em dash", () => {
    expect(formatBalanceAmount("0.000")).toBe("—");
    expect(formatBalanceAmount("  ")).toBe("—");
  });

  it("calculates the number of result pages", () => {
    expect(getPageCount(101, 50)).toBe(3);
    expect(getPageCount(0, 50)).toBe(0);
  });
});
