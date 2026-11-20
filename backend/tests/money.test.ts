import { Decimal } from "../src/lib/decimal";
import { describe, expect, it } from "vitest";
import { addAmounts, asMoney, formatAmount, formatRate, parseAmount, parseRate, toUsd } from "../src/lib/money";

describe("money precision", () => {
  it("adds fractions that drift in binary floating point", () => {
    const total = addAmounts([parseAmount("0.10"), parseAmount("0.20")]);

    expect(formatAmount(total)).toBe("0.30");
    expect(total.equals(new Decimal("0.30"))).toBe(true);
  });

  it("adds one thousand cents to an exact total", () => {
    const cents = Array.from({ length: 1000 }, () => parseAmount("0.01"));

    expect(formatAmount(addAmounts(cents))).toBe("10.00");
  });

  it("rounds a USD conversion half up to the cent", () => {
    expect(formatAmount(toUsd(parseAmount("100.00"), parseRate("0.12345")))).toBe("12.35");
    expect(formatAmount(toUsd(parseAmount("1.00"), parseRate("0.015")))).toBe("0.02");
    expect(formatAmount(toUsd(parseAmount("1.00"), parseRate("0.0125")))).toBe("0.01");
  });

  it("formats rates at 8 decimal places without changing the stored scale", () => {
    expect(formatRate(parseRate("0.012"))).toBe("0.01200000");
  });

  it("rejects a salary that arrived as a JavaScript number", () => {
    expect(() => asMoney(0.1)).toThrow(/JavaScript number/);
    expect(formatAmount(asMoney("84250.10"))).toBe("84250.10");
  });

  it("rejects amounts that are not positive 2-decimal salaries", () => {
    expect(() => parseAmount("0")).toThrow(/greater than zero/);
    expect(() => parseAmount("-5.00")).toThrow(/positive decimal/);
    expect(() => parseAmount("10.999")).toThrow(/2 decimal places/);
    expect(() => parseAmount("1000000000000.00")).toThrow(/supported range/);
    expect(() => parseAmount("84,250.00")).toThrow(/positive decimal/);
  });
});
