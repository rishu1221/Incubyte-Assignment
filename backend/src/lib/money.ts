import { Decimal } from "./decimal";

const MONEY_SCALE = 2;
const RATE_SCALE = 8;
const MAX_AMOUNT = new Decimal("999999999999.99");
const MAX_RATE = new Decimal("9999999999.99999999");

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoneyError";
  }
}

function parsePositiveDecimal(input: string, label: string): Decimal {
  const trimmed = input.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new MoneyError(`${label} must be a positive decimal`);
  }
  return new Decimal(trimmed);
}

function fractionLength(value: string): number {
  const fraction = value.trim().split(".")[1];
  return fraction ? fraction.length : 0;
}

/** Gross annual salary. Accepts at most 2 decimal places and rejects non-positive values. */
export function parseAmount(input: string): Decimal {
  if (fractionLength(input) > MONEY_SCALE) {
    throw new MoneyError("Amount must have at most 2 decimal places");
  }
  const amount = parsePositiveDecimal(input, "Amount");
  if (amount.lte(0)) {
    throw new MoneyError("Amount must be greater than zero");
  }
  if (amount.gt(MAX_AMOUNT)) {
    throw new MoneyError("Amount exceeds the supported range");
  }
  return amount;
}

/** Static USD-per-unit rate. Accepts at most 8 decimal places. */
export function parseRate(input: string): Decimal {
  if (fractionLength(input) > RATE_SCALE) {
    throw new MoneyError("Rate must have at most 8 decimal places");
  }
  const rate = parsePositiveDecimal(input, "Rate");
  if (rate.lte(0)) {
    throw new MoneyError("Rate must be greater than zero");
  }
  if (rate.gt(MAX_RATE)) {
    throw new MoneyError("Rate exceeds the supported range");
  }
  return rate;
}

export function addAmounts(amounts: readonly Decimal[]): Decimal {
  return amounts.reduce((sum, amount) => sum.plus(amount), new Decimal(0));
}

/** Rounded USD display value. Does not change the stored salary or the stored rate. */
export function toUsd(amount: Decimal, usdPerUnit: Decimal): Decimal {
  return amount.mul(usdPerUnit).toDecimalPlaces(MONEY_SCALE, Decimal.ROUND_HALF_UP);
}

export function formatAmount(amount: Decimal): string {
  return amount.toFixed(MONEY_SCALE);
}

export function formatRate(rate: Decimal): string {
  return rate.toFixed(RATE_SCALE);
}

/** Accepts a Prisma decimal or an exact decimal string from PostgreSQL. Rejects binary numbers. */
export function asMoney(value: unknown): Decimal {
  if (typeof value === "number") {
    throw new MoneyError("Money value was read as a JavaScript number");
  }
  if (Decimal.isDecimal(value)) {
    return new Decimal(value.toString());
  }
  if (typeof value === "string" && value.trim() !== "") {
    return new Decimal(value.trim());
  }
  throw new MoneyError("Money value is missing");
}
