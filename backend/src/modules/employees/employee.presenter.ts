import { asMoney, formatAmount } from "../../lib/money";
import { utcDateString } from "../revisions/revision.rules";
import type { EmployeeListItem, EmployeeRecord, RevisionRecord } from "./employee.types";

function presentIdentity(employee: EmployeeRecord) {
  return {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    jobTitle: employee.jobTitle,
    status: employee.status,
    hireDate: utcDateString(employee.hireDate),
    country: {
      code: employee.country.code.trim(),
      name: employee.country.name,
    },
    department: employee.department,
    level: employee.level,
  };
}

export function presentCurrentSalary(salary: EmployeeListItem["currentSalary"]) {
  if (!salary) {
    return null;
  }
  return {
    amount: formatAmount(asMoney(salary.amount)),
    currencyCode: salary.currencyCode.trim(),
    effectiveDate: utcDateString(salary.effectiveDate),
  };
}

export function presentEmployee(employee: EmployeeListItem) {
  return {
    ...presentIdentity(employee),
    currentSalary: presentCurrentSalary(employee.currentSalary),
  };
}

export function presentRevision(revision: RevisionRecord) {
  return {
    id: revision.id,
    amount: formatAmount(asMoney(revision.amount)),
    currencyCode: revision.currencyCode.trim(),
    effectiveDate: utcDateString(revision.effectiveDate),
    reason: revision.reason,
    createdAt: revision.createdAt.toISOString(),
  };
}

export function presentEmployeeDetail(
  employee: EmployeeRecord,
  revisions: RevisionRecord[],
  current: RevisionRecord | null,
) {
  return {
    ...presentIdentity(employee),
    currentSalary: current
      ? {
          amount: formatAmount(asMoney(current.amount)),
          currencyCode: current.currencyCode.trim(),
          effectiveDate: utcDateString(current.effectiveDate),
        }
      : null,
    revisions: revisions.map(presentRevision),
  };
}
