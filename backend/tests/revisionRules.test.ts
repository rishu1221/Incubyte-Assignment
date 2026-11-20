import { describe, expect, it } from "vitest";
import { normalizeCurrencyCode, normalizeReason, parseIsoDate } from "../src/modules/revisions/revision.rules";

describe("revision rules", () => {
  it("accepts a real calendar date and rejects an impossible one", () => {
    expect(parseIsoDate("2026-02-28", "Effective date").toISOString()).toBe("2026-02-28T00:00:00.000Z");
    expect(() => parseIsoDate("2026-02-31", "Effective date")).toThrow(/real date/);
    expect(() => parseIsoDate("26-02-01", "Effective date")).toThrow(/YYYY-MM-DD/);
  });

  it("normalizes a currency code and a reason", () => {
    expect(normalizeCurrencyCode(" inr ")).toBe("INR");
    expect(() => normalizeCurrencyCode("US")).toThrow(/3-letter/);
    expect(normalizeReason("  Annual review  ")).toBe("Annual review");
    expect(() => normalizeReason("   ")).toThrow(/1 to 500/);
  });
});
