import { formatAmount, parseAmount } from "../../lib/money";
import { AppError } from "../../utils/AppError";
import { employeeRepository } from "../employees/employee.repository";
import type { RevisionRecord } from "../employees/employee.types";
import { normalizeCurrencyCode, normalizeReason, parseIsoDate, utcDateString } from "./revision.rules";
import { revisionRepository } from "./revision.repository";

export type CreateRevisionInput = {
  amount: string;
  currencyCode: string;
  effectiveDate: string;
  reason: string;
};

function presentCreated(revision: RevisionRecord) {
  return {
    id: revision.id,
    employeeId: revision.employeeId,
    amount: formatAmount(revision.amount),
    currencyCode: revision.currencyCode,
    effectiveDate: utcDateString(revision.effectiveDate),
    reason: revision.reason,
    createdAt: revision.createdAt.toISOString(),
  };
}

export const revisionService = {
  async create(employeeId: string, input: CreateRevisionInput) {
    const amount = parseAmount(input.amount);
    const currencyCode = normalizeCurrencyCode(input.currencyCode);
    const effectiveDate = parseIsoDate(input.effectiveDate, "Effective date");
    const reason = normalizeReason(input.reason);

    const employeeExists = await employeeRepository.exists(employeeId);
    if (!employeeExists) {
      throw new AppError("Employee not found", 404);
    }
    const currency = await revisionRepository.findCurrency(currencyCode);
    if (!currency) {
      throw new AppError("Unknown currency", 400);
    }

    const revision = await revisionRepository.create({
      employeeId,
      amount,
      currencyCode,
      effectiveDate,
      reason,
    });
    return presentCreated(revision);
  },
};
