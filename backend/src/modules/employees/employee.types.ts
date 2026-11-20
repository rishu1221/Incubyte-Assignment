import type { EmploymentStatus } from "@prisma/client";
import type { Decimal } from "../../lib/decimal";

export type EmployeeRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  status: EmploymentStatus;
  hireDate: Date;
  country: { code: string; name: string };
  department: { id: string; name: string };
  level: { id: string; code: string; name: string; rank: number };
};

export type CurrentSalary = {
  amount: Decimal;
  currencyCode: string;
  effectiveDate: Date;
};

export type EmployeeListItem = EmployeeRecord & {
  currentSalary: CurrentSalary | null;
};

export type RevisionRecord = {
  id: string;
  employeeId: string;
  amount: Decimal;
  currencyCode: string;
  effectiveDate: Date;
  reason: string;
  createdAt: Date;
};

export type HireEmployeeInput = {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  departmentId: string;
  levelId: string;
  jobTitle: string;
  status: EmploymentStatus;
  hireDate: Date;
  amount: Decimal;
  currencyCode: string;
  effectiveDate: Date;
  reason: string;
};
