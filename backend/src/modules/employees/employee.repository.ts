import type { Decimal } from "../../lib/decimal";
import { join, sql, type Sql } from "../../lib/sql";
import { prisma, type DbTransaction } from "../../lib/prisma";
import { asMoney } from "../../lib/money";
import { rethrowKnownPrismaError } from "../../lib/prismaErrors";
import { currentRevisionSelect } from "../revisions/currentSalarySql";
import { containsPattern, listOffset, type EmployeeListQuery } from "./employee.query";
import type { EmployeeListItem, EmployeeRecord, HireEmployeeInput } from "./employee.types";

type EmployeeListRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  status: EmployeeRecord["status"];
  hire_date: Date;
  country_code: string;
  country_name: string;
  department_id: string;
  department_name: string;
  level_id: string;
  level_code: string;
  level_name: string;
  level_rank: number;
  amount: Decimal | string | null;
  currency_code: string | null;
  effective_date: Date | null;
};

function employeeWhere(query: EmployeeListQuery): Sql {
  const parts: Sql[] = [];
  if (query.search) {
    const pattern = containsPattern(query.search);
    parts.push(sql`(
      e.first_name ILIKE ${pattern} ESCAPE '\\'
      OR e.last_name ILIKE ${pattern} ESCAPE '\\'
      OR e.email ILIKE ${pattern} ESCAPE '\\'
    )`);
  }
  if (query.countryCode) {
    parts.push(sql`e.country_code = ${query.countryCode}`);
  }
  if (query.departmentId) {
    parts.push(sql`e.department_id = ${query.departmentId}::uuid`);
  }
  if (query.levelId) {
    parts.push(sql`e.level_id = ${query.levelId}::uuid`);
  }
  if (query.status) {
    parts.push(sql`e.status::text = ${query.status}`);
  }
  if (parts.length === 0) {
    return sql`TRUE`;
  }
  return join(parts, " AND ");
}

function mapListRow(row: EmployeeListRow): EmployeeListItem {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    jobTitle: row.job_title,
    status: row.status,
    hireDate: row.hire_date,
    country: { code: row.country_code.trim(), name: row.country_name },
    department: { id: row.department_id, name: row.department_name },
    level: {
      id: row.level_id,
      code: row.level_code,
      name: row.level_name,
      rank: row.level_rank,
    },
    currentSalary:
      row.amount === null || row.currency_code === null || row.effective_date === null
        ? null
        : {
            amount: asMoney(row.amount),
            currencyCode: row.currency_code.trim(),
            effectiveDate: row.effective_date,
          },
  };
}

function toCount(value: number | bigint | string): number {
  const count = typeof value === "bigint" ? Number(value) : Number(value);
  if (!Number.isSafeInteger(count)) {
    throw new Error("Employee count is out of range");
  }
  return count;
}

export const employeeRepository = {
  async exists(id: string): Promise<boolean> {
    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { id: true },
    });
    return employee !== null;
  },

  async findById(id: string): Promise<EmployeeRecord | null> {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { country: true, department: true, level: true },
    });
    if (!employee) {
      return null;
    }
    return {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      jobTitle: employee.jobTitle,
      status: employee.status,
      hireDate: employee.hireDate,
      country: { code: employee.country.code.trim(), name: employee.country.name },
      department: { id: employee.department.id, name: employee.department.name },
      level: {
        id: employee.level.id,
        code: employee.level.code,
        name: employee.level.name,
        rank: employee.level.rank,
      },
    };
  },

  async list(query: EmployeeListQuery): Promise<{ items: EmployeeListItem[]; total: number }> {
    const where = employeeWhere(query);
    const offset = listOffset(query);
    const [rows, counts] = await prisma.$transaction([
      prisma.$queryRaw<EmployeeListRow[]>`
        SELECT
          e.id,
          e.first_name,
          e.last_name,
          e.email,
          e.job_title,
          e.status::text AS status,
          e.hire_date,
          c.code AS country_code,
          c.name AS country_name,
          d.id AS department_id,
          d.name AS department_name,
          l.id AS level_id,
          l.code AS level_code,
          l.name AS level_name,
          l.rank AS level_rank,
          current_salary.amount,
          current_salary.currency_code,
          current_salary.effective_date
        FROM employees e
        JOIN countries c ON c.code = e.country_code
        JOIN departments d ON d.id = e.department_id
        JOIN job_levels l ON l.id = e.level_id
        LEFT JOIN LATERAL (
          ${currentRevisionSelect}
        ) current_salary ON TRUE
        WHERE ${where}
        ORDER BY e.last_name ASC, e.first_name ASC, e.id ASC
        LIMIT ${query.pageSize}
        OFFSET ${offset}
      `,
      prisma.$queryRaw<Array<{ count: number | bigint }>>`
        SELECT COUNT(*)::int AS count
        FROM employees e
        WHERE ${where}
      `,
    ]);

    return {
      items: rows.map(mapListRow),
      total: toCount(counts[0]?.count ?? 0),
    };
  },

  async insertWithRevision(input: HireEmployeeInput): Promise<{ employeeId: string; revisionId: string }> {
    try {
      return await prisma.$transaction(async (tx: DbTransaction) => {
        const employee = await tx.employee.create({
          data: {
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            countryCode: input.countryCode,
            departmentId: input.departmentId,
            levelId: input.levelId,
            jobTitle: input.jobTitle,
            status: input.status,
            hireDate: input.hireDate,
          },
        });
        const revision = await tx.salaryRevision.create({
          data: {
            employeeId: employee.id,
            amount: input.amount,
            currencyCode: input.currencyCode,
            effectiveDate: input.effectiveDate,
            reason: input.reason,
          },
        });
        return { employeeId: employee.id, revisionId: revision.id };
      });
    } catch (error) {
      rethrowKnownPrismaError(error);
    }
  },
};
