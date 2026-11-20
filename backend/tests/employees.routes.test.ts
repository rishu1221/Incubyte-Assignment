import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/modules/employees/employee.service", () => ({
  employeeService: {
    list: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock("../src/modules/revisions/revision.service", () => ({
  revisionService: {
    create: vi.fn(),
  },
}));

import { createApp } from "../src/app";
import { employeeService } from "../src/modules/employees/employee.service";
import { revisionService } from "../src/modules/revisions/revision.service";

describe("employee routes", () => {
  const app = createApp();

  beforeEach(() => {
    vi.mocked(employeeService.list).mockReset();
    vi.mocked(employeeService.get).mockReset();
    vi.mocked(revisionService.create).mockReset();
  });

  it("lists employees with a string salary", async () => {
    vi.mocked(employeeService.list).mockResolvedValue({
      items: [
        {
          id: "employee-1",
          firstName: "Ava",
          lastName: "Shah",
          email: "ava.shah@acme.test",
          jobTitle: "Software Engineer",
          status: "ACTIVE",
          hireDate: "2024-01-15",
          country: { code: "IN", name: "India" },
          department: { id: "dept-1", name: "Engineering" },
          level: { id: "level-1", code: "L2", name: "Mid", rank: 2 },
          currentSalary: { amount: "120000.50", currencyCode: "INR", effectiveDate: "2026-06-01" },
        },
      ],
      page: 1,
      pageSize: 25,
      total: 1,
    });

    const response = await request(app).get("/api/v1/employees?country=in&page=1&pageSize=25");

    expect(response.status).toBe(200);
    expect(response.body.data.items[0].currentSalary.amount).toBe("120000.50");
    expect(employeeService.list).toHaveBeenCalledWith(expect.objectContaining({ country: "IN", page: 1, pageSize: 25 }));
  });

  it("rejects a non-uuid employee id", async () => {
    const response = await request(app).get("/api/v1/employees/not-a-uuid");

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(employeeService.get).not.toHaveBeenCalled();
  });

  it("creates a revision and returns the formatted amount", async () => {
    vi.mocked(revisionService.create).mockResolvedValue({
      id: "rev-1",
      employeeId: "4f3b0f0e-4c1a-4a3e-9c1a-6b1d2a3e4f50",
      amount: "130000.00",
      currencyCode: "INR",
      effectiveDate: "2026-12-01",
      reason: "Promotion",
      createdAt: "2026-11-20T09:00:00.000Z",
    });

    const response = await request(app)
      .post("/api/v1/employees/4f3b0f0e-4c1a-4a3e-9c1a-6b1d2a3e4f50/revisions")
      .send({
        amount: "130000.00",
        currencyCode: "INR",
        effectiveDate: "2026-12-01",
        reason: "Promotion",
      });

    expect(response.status).toBe(201);
    expect(response.body.data.amount).toBe("130000.00");
  });
});
