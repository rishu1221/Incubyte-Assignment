import { AppError } from "../../utils/AppError";

export function parseIsoDate(input: string, label: string): Date {
  const trimmed = input.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) {
    throw new AppError(`${label} must be YYYY-MM-DD`, 400);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new AppError(`${label} must be a real date`, 400);
  }
  return date;
}

export function utcDateString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function utcToday(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function normalizeCurrencyCode(input: string): string {
  const code = input.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) {
    throw new AppError("Currency must be a 3-letter ISO code", 400);
  }
  return code;
}

export function normalizeReason(reason: string): string {
  const trimmed = reason.trim();
  if (trimmed.length === 0 || trimmed.length > 500) {
    throw new AppError("Reason must be 1 to 500 characters", 400);
  }
  return trimmed;
}
