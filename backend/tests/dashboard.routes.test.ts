import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/modules/dashboard/dashboard.service", () => ({
  dashboardService: {
    get: vi.fn(),
  },
}));

import { createApp } from "../src/app";
import { dashboardService } from "../src/modules/dashboard/dashboard.service";

describe("GET /api/v1/dashboard", () => {
  const app = createApp();

  beforeEach(() => {
    vi.mocked(dashboardService.get).mockReset();
  });

  it("returns the dashboard envelope for an uppercase country filter", async () => {
    vi.mocked(dashboardService.get).mockResolvedValue({
      population: {
        statuses: ["ACTIVE", "ON_LEAVE"],
        countryCode: null,
        departmentId: null,
        levelId: null,
        currencyCode: null,
        headcount: 1,
      },
      byCurrency: [],
      byCountry: [],
      byDepartment: [],
      byLevel: [],
      extremes: { byCurrency: [], usd: { highest: null, lowest: null } },
      usd: {
        approximate: true,
        headcount: 1,
        total: "1000.00",
        average: "1000.00",
        median: "1000.00",
        rateDate: "2026-01-01",
      },
      bands: [],
    });

    const response = await request(app).get("/api/v1/dashboard?country=de");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.usd.approximate).toBe(true);
    expect(response.body.data.usd.total).toBe("1000.00");
    expect(dashboardService.get).toHaveBeenCalledWith(expect.objectContaining({ country: "DE" }));
  });

  it("rejects an unknown currency filter", async () => {
    const response = await request(app).get("/api/v1/dashboard?currency=US");

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(dashboardService.get).not.toHaveBeenCalled();
  });
});