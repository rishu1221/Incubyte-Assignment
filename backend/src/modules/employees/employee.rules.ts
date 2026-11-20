import { AppError } from "../../utils/AppError";

export function requiredText(value: string, label: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > max) {
    throw new AppError(`${label} must be 1 to ${max} characters`, 400);
  }
  return trimmed;
}

export function normalizeEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new AppError("Email is invalid", 400);
  }
  return normalized;
}

export function normalizeCountryCode(input: string): string {
  const code = input.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) {
    throw new AppError("Country must be a 2-letter ISO code", 400);
  }
  return code;
}
