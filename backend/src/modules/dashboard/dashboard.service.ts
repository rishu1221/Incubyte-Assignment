import { formatAmount } from "../../lib/money";
import type { Decimal } from "../../lib/decimal";
import { utcDateString } from "../revisions/revision.rules";
import type { DashboardQueryInput } from "./dashboard.schema";
import { dashboardRepository } from "./dashboard.repository";
import type { CurrencyStats, GroupStats, MoneyStats, PaidStatus, PayExtreme } from "./dashboard.types";

const PAID_STATUSES: PaidStatus[] = ["ACTIVE", "ON_LEAVE"];

function money(value: Decimal | null): string | null {
  return value === null ? null : formatAmount(value);
}

function presentStats(stats: MoneyStats) {
  return {
    headcount: stats.headcount,
    total: formatAmount(stats.total),
    average: money(stats.average),
    median: money(stats.median),
  };
}

function presentCurrency(stats: CurrencyStats) {
  return { currencyCode: stats.currencyCode, ...presentStats(stats) };
}

function presentGroup(stats: GroupStats) {
  return {
    id: stats.id,
    code: stats.code ?? null,
    name: stats.name,
    rank: stats.rank ?? null,
    currencyCode: stats.currencyCode,
    ...presentStats(stats),
  };
}

function presentExtreme(extreme: PayExtreme | null) {
  if (!extreme) {
    return null;
  }
  return {
    employeeId: extreme.employeeId,
    name: `${extreme.firstName} ${extreme.lastName}`,
    currencyCode: extreme.currencyCode,
    amount: formatAmount(extreme.amount),
    usdAmount: formatAmount(extreme.usdAmount),
  };
}

export const dashboardService = {
  async get(input: DashboardQueryInput) {
    const statuses: PaidStatus[] = input.status ? [input.status] : PAID_STATUSES;
    const snapshot = await dashboardRepository.load({
      countryCode: input.country,
      departmentId: input.departmentId,
      levelId: input.levelId,
      currencyCode: input.currency,
      statuses,
    });
    const rateDate = snapshot.rateDate ? utcDateString(snapshot.rateDate) : null;

    return {
      population: {
        statuses,
        countryCode: input.country ?? null,
        departmentId: input.departmentId ?? null,
        levelId: input.levelId ?? null,
        currencyCode: input.currency ?? null,
        headcount: snapshot.headcount,
      },
      byCurrency: snapshot.byCurrency.map(presentCurrency),
      byCountry: snapshot.byCountry.map((row) => ({
        countryCode: row.countryCode,
        ...presentGroup(row),
      })),
      byDepartment: snapshot.byDepartment.map(presentGroup),
      byLevel: snapshot.byLevel.map(presentGroup),
      extremes: {
        byCurrency: snapshot.extremesByCurrency.map((row) => ({
          currencyCode: row.currencyCode,
          highest: presentExtreme(row.highest),
          lowest: presentExtreme(row.lowest),
        })),
        usd: {
          highest: presentExtreme(snapshot.usdHighest),
          lowest: presentExtreme(snapshot.usdLowest),
        },
      },
      usd: {
        approximate: true,
        rateDate,
        ...presentStats(snapshot.usd),
      },
      bands: snapshot.bands,
    };
  },
};
