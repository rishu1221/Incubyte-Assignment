import { Decimal } from "../src/lib/decimal";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/modules/dashboard/dashboard.repository", () => ({
  dashboardRepository: {
    load: vi.fn(),
  },
}));

import { dashboardRepository } from "../src/modules/dashboard/dashboard.repository";
import { dashboardService } from "../src/modules/dashboard/dashboard.service";
import type { DashboardSnapshot } from "../src/modules/dashboard/dashboard.types";

function money(value: string): Decimal {
  return new Decimal(value);
}

function snapshot(): DashboardSnapshot {
  return {
    headcount: 2,
    rateDate: new Date("2026-01-01T00:00:00.000Z"),
    byCurrency: [
      { currencyCode: "INR", headcount: 1, total: money("120000.50"), average: money("120000.50"), median: money("120000.50") },
      { currencyCode: "EUR", headcount: 1, total: money("80000.00"), average: money("80000.00"), median: money("80000.00") },
    ],
    byCountry: [],
    byDepartment: [],
    byLevel: [],
    extremesByCurrency: [],
    usdHighest: null,
    usdLowest: null,
    usd: {
      headcount: 2,
      total: money("2240.01"),
      average: money("1120.01"),
      median: money("1120.00"),
    },
    bands: [{ label: "Under 50,000 USD", min: null, max: "50000.00", headcount: 2 }],
  };
}

describe("dashboardService", () => {
  beforeEach(() => {
    vi.mocked(dashboardRepository.load).mockReset();
    vi.mocked(dashboardRepository.load).mockResolvedValue(snapshot());
  });

  it("keeps each currency total separate and marks the USD rollup as approximate", async () => {
    const dashboard = await dashboardService.get({});

    expect(dashboard.byCurrency.map((row) => row.total)).toEqual(["120000.50", "80000.00"]);
    expect(dashboard.usd).toMatchObject({
      approximate: true,
      rateDate: "2026-01-01",
      total: "2240.01",
      average: "1120.01",
      median: "1120.00",
    });
    expect(dashboard.population.statuses).toEqual(["ACTIVE", "ON_LEAVE"]);
  });

  it("limits the population to one status when the filter asks for it", async () => {
    await dashboardService.get({ status: "TERMINATED" });

    expect(dashboardRepository.load).toHaveBeenCalledWith(
      expect.objectContaining({ statuses: ["TERMINATED"] }),
    );
  });
});
