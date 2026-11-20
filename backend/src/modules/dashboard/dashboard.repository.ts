import { Decimal } from "../../lib/decimal";
import { join, sql, type Sql } from "../../lib/sql";
import { prisma, type DbTransaction } from "../../lib/prisma";
import { asMoney } from "../../lib/money";
import { AppError } from "../../utils/AppError";
import { currentRevisionSelect } from "../revisions/currentSalarySql";
import { USD_SALARY_BANDS } from "./salaryBands";
import type {
  CurrencyStats,
  DashboardQuery,
  DashboardSnapshot,
  GroupStats,
  MoneyStats,
  PayExtreme,
} from "./dashboard.types";

type MoneyRow = {
  headcount: number | bigint | string;
  total: Decimal | string | null;
  average: Decimal | string | null;
  median: Decimal | string | null;
};

type ExtremeRow = {
  employee_id: string;
  first_name: string;
  last_name: string;
  currency_code: string;
  amount: Decimal | string;
  usd_amount: Decimal | string;
};

function toCount(value: number | bigint | string): number {
  const count = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(count)) {
    throw new AppError("Dashboard count is out of range", 500);
  }
  return count;
}

function toAmount(value: Decimal | string | null): Decimal | null {
  if (value === null) {
    return null;
  }
  return asMoney(value);
}

function requiredAmount(value: Decimal | string | null): Decimal {
  const amount = toAmount(value);
  if (amount === null) {
    return new Decimal(0);
  }
  return amount;
}

function numericLiteral(value: string | null): Sql {
  if (value === null) {
    return sql`NULL::numeric`;
  }
  return sql`${value}::numeric`;
}

function populationWhere(query: DashboardQuery): Sql {
  const parts: Sql[] = [sql`e.status::text IN (${join(query.statuses)})`];
  if (query.countryCode) {
    parts.push(sql`c.code = ${query.countryCode}`);
  }
  if (query.departmentId) {
    parts.push(sql`d.id = ${query.departmentId}::uuid`);
  }
  if (query.levelId) {
    parts.push(sql`l.id = ${query.levelId}::uuid`);
  }
  if (query.currencyCode) {
    parts.push(sql`s.currency_code = ${query.currencyCode}`);
  }
  return join(parts, " AND ");
}

function mapExtreme(row: ExtremeRow): PayExtreme {
  return {
    employeeId: row.employee_id,
    firstName: row.first_name,
    lastName: row.last_name,
    currencyCode: row.currency_code.trim(),
    amount: asMoney(row.amount),
    usdAmount: asMoney(row.usd_amount),
  };
}

function mapMoney(row: MoneyRow): MoneyStats {
  return {
    headcount: toCount(row.headcount),
    total: requiredAmount(row.total),
    average: toAmount(row.average),
    median: toAmount(row.median),
  };
}

export const dashboardRepository = {
  async load(query: DashboardQuery): Promise<DashboardSnapshot> {
    return prisma.$transaction(async (tx: DbTransaction) => {
      await tx.$executeRaw`
        CREATE TEMP TABLE dashboard_pay ON COMMIT DROP AS
        SELECT
          e.id AS employee_id,
          e.first_name,
          e.last_name,
          c.code AS country_code,
          c.name AS country_name,
          d.id AS department_id,
          d.name AS department_name,
          l.id AS level_id,
          l.code AS level_code,
          l.name AS level_name,
          l.rank AS level_rank,
          s.amount,
          s.currency_code,
          cur.rate_date,
          ROUND(s.amount * cur.usd_per_unit, 2) AS usd_amount
        FROM employees e
        JOIN countries c ON c.code = e.country_code
        JOIN departments d ON d.id = e.department_id
        JOIN job_levels l ON l.id = e.level_id
        JOIN LATERAL (
          ${currentRevisionSelect}
        ) s ON TRUE
        JOIN currencies cur ON cur.code = s.currency_code
        WHERE ${populationWhere(query)}
      `;

      const byCurrency = await currencyStats(tx);
      const byCountry = await countryStats(tx);
      const byDepartment = await departmentStats(tx);
      const byLevel = await levelStats(tx);
      const highest = await extremes(tx, "DESC");
      const lowest = await extremes(tx, "ASC");
      const usdHighestRows = await usdExtreme(tx, "DESC");
      const usdLowestRows = await usdExtreme(tx, "ASC");
      const usdRows = await usdStats(tx);
      const bandRows = await bandStats(tx);
      const rateRows = await tx.$queryRaw<Array<{ rate_date: Date | null }>>`
        SELECT MIN(rate_date) AS rate_date FROM dashboard_pay
      `;

      return {
        headcount: usdRows.headcount,
        rateDate: rateRows[0]?.rate_date ?? null,
        byCurrency,
        byCountry,
        byDepartment,
        byLevel,
        extremesByCurrency: mergeExtremes(highest, lowest),
        usdHighest: usdHighestRows[0] ? mapExtreme(usdHighestRows[0]) : null,
        usdLowest: usdLowestRows[0] ? mapExtreme(usdLowestRows[0]) : null,
        usd: usdRows,
        bands: bandRows,
      };
    }, { timeout: 20_000 });
  },
};

function mergeExtremes(highest: PayExtreme[], lowest: PayExtreme[]): DashboardSnapshot["extremesByCurrency"] {
  const codes = [...new Set([...highest, ...lowest].map((row) => row.currencyCode))].sort();
  return codes.map((currencyCode) => ({
    currencyCode,
    highest: highest.find((row) => row.currencyCode === currencyCode) ?? null,
    lowest: lowest.find((row) => row.currencyCode === currencyCode) ?? null,
  }));
}

async function currencyStats(tx: DbTransaction): Promise<CurrencyStats[]> {
  const rows = await tx.$queryRaw<Array<MoneyRow & { currency_code: string }>>`
    WITH ranked AS (
      SELECT
        currency_code,
        amount,
        row_number() OVER (PARTITION BY currency_code ORDER BY amount, employee_id) AS rn,
        COUNT(*) OVER (PARTITION BY currency_code) AS n
      FROM dashboard_pay
    ),
    medians AS (
      SELECT currency_code, ROUND(AVG(amount), 2) AS median
      FROM ranked
      WHERE rn IN ((n + 1) / 2, (n + 2) / 2)
      GROUP BY currency_code
    )
    SELECT
      p.currency_code,
      COUNT(*)::int AS headcount,
      ROUND(SUM(p.amount), 2) AS total,
      ROUND(AVG(p.amount), 2) AS average,
      m.median
    FROM dashboard_pay p
    JOIN medians m ON m.currency_code = p.currency_code
    GROUP BY p.currency_code, m.median
    ORDER BY p.currency_code ASC
  `;
  return rows.map((row) => ({ currencyCode: row.currency_code.trim(), ...mapMoney(row) }));
}

async function countryStats(tx: DbTransaction): Promise<DashboardSnapshot["byCountry"]> {
  const rows = await tx.$queryRaw<
    Array<MoneyRow & { country_code: string; country_name: string; currency_code: string }>
  >`
    WITH ranked AS (
      SELECT
        country_code,
        currency_code,
        amount,
        row_number() OVER (PARTITION BY country_code, currency_code ORDER BY amount, employee_id) AS rn,
        COUNT(*) OVER (PARTITION BY country_code, currency_code) AS n
      FROM dashboard_pay
    ),
    medians AS (
      SELECT country_code, currency_code, ROUND(AVG(amount), 2) AS median
      FROM ranked
      WHERE rn IN ((n + 1) / 2, (n + 2) / 2)
      GROUP BY country_code, currency_code
    )
    SELECT
      p.country_code,
      p.country_name,
      p.currency_code,
      COUNT(*)::int AS headcount,
      ROUND(SUM(p.amount), 2) AS total,
      ROUND(AVG(p.amount), 2) AS average,
      m.median
    FROM dashboard_pay p
    JOIN medians m ON m.country_code = p.country_code AND m.currency_code = p.currency_code
    GROUP BY p.country_code, p.country_name, p.currency_code, m.median
    ORDER BY p.country_name ASC, p.currency_code ASC
  `;
  return rows.map((row) => ({
    countryCode: row.country_code.trim(),
    id: row.country_code.trim(),
    name: row.country_name,
    currencyCode: row.currency_code.trim(),
    ...mapMoney(row),
  }));
}

async function departmentStats(tx: DbTransaction): Promise<GroupStats[]> {
  const rows = await tx.$queryRaw<
    Array<MoneyRow & { department_id: string; department_name: string; currency_code: string }>
  >`
    WITH ranked AS (
      SELECT
        department_id,
        currency_code,
        amount,
        row_number() OVER (PARTITION BY department_id, currency_code ORDER BY amount, employee_id) AS rn,
        COUNT(*) OVER (PARTITION BY department_id, currency_code) AS n
      FROM dashboard_pay
    ),
    medians AS (
      SELECT department_id, currency_code, ROUND(AVG(amount), 2) AS median
      FROM ranked
      WHERE rn IN ((n + 1) / 2, (n + 2) / 2)
      GROUP BY department_id, currency_code
    )
    SELECT
      p.department_id,
      p.department_name,
      p.currency_code,
      COUNT(*)::int AS headcount,
      ROUND(SUM(p.amount), 2) AS total,
      ROUND(AVG(p.amount), 2) AS average,
      m.median
    FROM dashboard_pay p
    JOIN medians m ON m.department_id = p.department_id AND m.currency_code = p.currency_code
    GROUP BY p.department_id, p.department_name, p.currency_code, m.median
    ORDER BY p.department_name ASC, p.currency_code ASC
  `;
  return rows.map((row) => ({
    id: row.department_id,
    name: row.department_name,
    currencyCode: row.currency_code.trim(),
    ...mapMoney(row),
  }));
}

async function levelStats(tx: DbTransaction): Promise<GroupStats[]> {
  const rows = await tx.$queryRaw<
    Array<MoneyRow & { level_id: string; level_code: string; level_name: string; level_rank: number; currency_code: string }>
  >`
    WITH ranked AS (
      SELECT
        level_id,
        currency_code,
        amount,
        row_number() OVER (PARTITION BY level_id, currency_code ORDER BY amount, employee_id) AS rn,
        COUNT(*) OVER (PARTITION BY level_id, currency_code) AS n
      FROM dashboard_pay
    ),
    medians AS (
      SELECT level_id, currency_code, ROUND(AVG(amount), 2) AS median
      FROM ranked
      WHERE rn IN ((n + 1) / 2, (n + 2) / 2)
      GROUP BY level_id, currency_code
    )
    SELECT
      p.level_id,
      p.level_code,
      p.level_name,
      p.level_rank,
      p.currency_code,
      COUNT(*)::int AS headcount,
      ROUND(SUM(p.amount), 2) AS total,
      ROUND(AVG(p.amount), 2) AS average,
      m.median
    FROM dashboard_pay p
    JOIN medians m ON m.level_id = p.level_id AND m.currency_code = p.currency_code
    GROUP BY p.level_id, p.level_code, p.level_name, p.level_rank, p.currency_code, m.median
    ORDER BY p.level_rank ASC, p.currency_code ASC
  `;
  return rows.map((row) => ({
    id: row.level_id,
    code: row.level_code,
    name: row.level_name,
    rank: row.level_rank,
    currencyCode: row.currency_code.trim(),
    ...mapMoney(row),
  }));
}

async function extremes(tx: DbTransaction, direction: "ASC" | "DESC"): Promise<PayExtreme[]> {
  const order = direction === "DESC" ? sql`amount DESC` : sql`amount ASC`;
  const rows = await tx.$queryRaw<ExtremeRow[]>`
    SELECT DISTINCT ON (currency_code)
      employee_id,
      first_name,
      last_name,
      currency_code,
      amount,
      usd_amount
    FROM dashboard_pay
    ORDER BY currency_code ASC, ${order}, employee_id ASC
  `;
  return rows.map(mapExtreme);
}

async function usdExtreme(tx: DbTransaction, direction: "ASC" | "DESC"): Promise<ExtremeRow[]> {
  const order = direction === "DESC" ? sql`usd_amount DESC` : sql`usd_amount ASC`;
  return tx.$queryRaw<ExtremeRow[]>`
    SELECT employee_id, first_name, last_name, currency_code, amount, usd_amount
    FROM dashboard_pay
    ORDER BY ${order}, employee_id ASC
    LIMIT 1
  `;
}

async function usdStats(tx: DbTransaction): Promise<MoneyStats> {
  const rows = await tx.$queryRaw<MoneyRow[]>`
    WITH ranked AS (
      SELECT
        usd_amount,
        row_number() OVER (ORDER BY usd_amount, employee_id) AS rn,
        COUNT(*) OVER () AS n
      FROM dashboard_pay
    ),
    median_row AS (
      SELECT ROUND(AVG(usd_amount), 2) AS median
      FROM ranked
      WHERE rn IN ((n + 1) / 2, (n + 2) / 2)
    )
    SELECT
      COUNT(*)::int AS headcount,
      COALESCE(ROUND(SUM(usd_amount), 2), 0) AS total,
      ROUND(AVG(usd_amount), 2) AS average,
      (SELECT median FROM median_row) AS median
    FROM dashboard_pay
  `;
  return mapMoney(
    rows[0] ?? { headcount: 0, total: "0.00", average: null, median: null },
  );
}

async function bandStats(tx: DbTransaction): Promise<DashboardSnapshot["bands"]> {
  const values = join(
    USD_SALARY_BANDS.map(
      (band, index) => sql`(
        ${index}::int,
        ${band.label},
        ${numericLiteral(band.min)},
        ${numericLiteral(band.max)}
      )`,
    ),
  );
  const rows = await tx.$queryRaw<
    Array<{ label: string; min_amount: Decimal | string | null; max_amount: Decimal | string | null; headcount: number | bigint }>
  >`
    SELECT
      b.label,
      b.min_amount,
      b.max_amount,
      COUNT(p.employee_id)::int AS headcount
    FROM (VALUES ${values}) AS b(sort_order, label, min_amount, max_amount)
    LEFT JOIN dashboard_pay p
      ON (b.min_amount IS NULL OR p.usd_amount >= b.min_amount)
     AND (b.max_amount IS NULL OR p.usd_amount < b.max_amount)
    GROUP BY b.sort_order, b.label, b.min_amount, b.max_amount
    ORDER BY b.sort_order ASC
  `;
  return rows.map((row) => ({
    label: row.label,
    min: row.min_amount === null ? null : asMoney(row.min_amount).toFixed(2),
    max: row.max_amount === null ? null : asMoney(row.max_amount).toFixed(2),
    headcount: toCount(row.headcount),
  }));
}
