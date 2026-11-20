import type { Decimal } from "../../lib/decimal";

export type PaidStatus = "ACTIVE" | "ON_LEAVE" | "TERMINATED";

export type DashboardQuery = {
  countryCode?: string;
  departmentId?: string;
  levelId?: string;
  currencyCode?: string;
  statuses: PaidStatus[];
};

export type MoneyStats = {
  headcount: number;
  total: Decimal;
  average: Decimal | null;
  median: Decimal | null;
};

export type CurrencyStats = MoneyStats & {
  currencyCode: string;
};

export type GroupStats = CurrencyStats & {
  id: string;
  code?: string;
  name: string;
  rank?: number;
};

export type PayExtreme = {
  employeeId: string;
  firstName: string;
  lastName: string;
  currencyCode: string;
  amount: Decimal;
  usdAmount: Decimal;
};

export type DashboardSnapshot = {
  headcount: number;
  rateDate: Date | null;
  byCurrency: CurrencyStats[];
  byCountry: Array<GroupStats & { countryCode: string }>;
  byDepartment: GroupStats[];
  byLevel: GroupStats[];
  extremesByCurrency: Array<{
    currencyCode: string;
    highest: PayExtreme | null;
    lowest: PayExtreme | null;
  }>;
  usdHighest: PayExtreme | null;
  usdLowest: PayExtreme | null;
  usd: MoneyStats;
  bands: Array<{ label: string; min: string | null; max: string | null; headcount: number }>;
};
