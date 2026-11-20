import type { EmploymentStatus } from "@prisma/client";
import { normalizeCountryCode } from "./employee.rules";

export type EmployeeListQuery = {
  search?: string;
  countryCode?: string;
  departmentId?: string;
  levelId?: string;
  status?: EmploymentStatus;
  page: number;
  pageSize: number;
};

export function normalizeListQuery(input: {
  search?: string;
  country?: string;
  departmentId?: string;
  levelId?: string;
  status?: EmploymentStatus;
  page: number;
  pageSize: number;
}): EmployeeListQuery {
  const search = input.search?.trim();
  const country = input.country?.trim();
  return {
    search: search ? search : undefined,
    countryCode: country ? normalizeCountryCode(country) : undefined,
    departmentId: input.departmentId,
    levelId: input.levelId,
    status: input.status,
    page: input.page,
    pageSize: input.pageSize,
  };
}

export function listOffset(query: Pick<EmployeeListQuery, "page" | "pageSize">): number {
  return (query.page - 1) * query.pageSize;
}

export function containsPattern(term: string): string {
  return `%${term.replace(/[\\%_]/g, (character) => `\\${character}`)}%`;
}
