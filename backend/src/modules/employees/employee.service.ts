import type { EmploymentStatus } from "@prisma/client";
import { formatAmount, parseAmount } from "../../lib/money";
import { AppError } from "../../utils/AppError";
import { selectCurrentRevision } from "../revisions/currentRevision";
import { revisionRepository } from "../revisions/revision.repository";
import { normalizeCurrencyCode, normalizeReason, parseIsoDate, utcToday } from "../revisions/revision.rules";
import { employeeRepository } from "./employee.repository";
import { normalizeCountryCode, normalizeEmail, requiredText } from "./employee.rules";
import { normalizeListQuery, type EmployeeListQuery } from "./employee.query";
import { presentEmployee, presentEmployeeDetail } from "./employee.presenter";

export type HireInput = {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  departmentId: string;
  levelId: string;
  jobTitle: string;
  status?: EmploymentStatus;
  hireDate: string;
  amount: string;
  currencyCode: string;
  effectiveDate: string;
  reason: string;
};

export const employeeService = {
  async list(input: Parameters<typeof normalizeListQuery>[0]) {
    const query: EmployeeListQuery = normalizeListQuery(input);
    const result = await employeeRepository.list(query);
    return {
      items: result.items.map(presentEmployee),
      page: query.page,
      pageSize: query.pageSize,
      total: result.total,
    };
  },

  async get(id: string, today = utcToday()) {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new AppError("Employee not found", 404);
    }
    const revisions = await revisionRepository.listByEmployee(id);
    const current = selectCurrentRevision(revisions, today);
    return presentEmployeeDetail(employee, revisions, current);
  },

  async createWithInitialRevision(input: HireInput) {
    const amount = parseAmount(input.amount);
    const created = await employeeRepository.insertWithRevision({
      firstName: requiredText(input.firstName, "First name", 100),
      lastName: requiredText(input.lastName, "Last name", 100),
      email: normalizeEmail(input.email),
      countryCode: normalizeCountryCode(input.countryCode),
      departmentId: input.departmentId,
      levelId: input.levelId,
      jobTitle: requiredText(input.jobTitle, "Job title", 120),
      status: input.status ?? "ACTIVE",
      hireDate: parseIsoDate(input.hireDate, "Hire date"),
      amount,
      currencyCode: normalizeCurrencyCode(input.currencyCode),
      effectiveDate: parseIsoDate(input.effectiveDate, "Effective date"),
      reason: normalizeReason(input.reason),
    });
    return {
      ...created,
      amount: formatAmount(amount),
      currencyCode: normalizeCurrencyCode(input.currencyCode),
    };
  },
};
