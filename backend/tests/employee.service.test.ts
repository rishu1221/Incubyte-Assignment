import { Decimal } from "../src/lib/decimal";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/modules/employees/employee.repository", () => ({
  employeeRepository: {
    exists: vi.fn(),
    findById: vi.fn(),
    list: vi.fn(),
    insertWithRevision: vi.fn(),
  },
}));

vi.mock("../src/modules/revisions/revision.repository", () => ({
  revisionRepository: {
    findCurrency: vi.fn(),
    create: vi.fn(),
    listByEmployee: vi.fn(),
  },
}));

import { employeeRepository } from "../src/modules/employees/employee.repository";
import { employeeService } from "../src/modules/employees/employee.service";
import { revisionRepository } from "../src/modules/revisions/revision.repository";

const employee = {
  id: "employee-1",
  firstName: "Ava",
  lastName: "Shah",
  email: "ava.shah@acme.test",
  jobTitle: "Engineer",
  status: "ACTIVE" as const,
  hireDate: new Date("2020-01-15T00:00:00.000Z"),
  country: { code: "IN", name: "India" },
  department: { id: "dept-1", name: "Engineering" },
  level: { id: "level-1", code: "L3", name: "Senior", rank: 3 },
};

describe("employeeService", () => {
  beforeEach(() => {
    vi.mocked(employeeRepository.findById).mockReset();
    vi.mocked(employeeRepository.insertWithRevision).mockReset();
    vi.mocked(revisionRepository.listByEmployee).mockReset();
  });

  it("keeps a future revision in history and reports the earlier amount as current", async () => {
    vi.mocked(employeeRepository.findById).mockResolvedValue(employee);
    vi.mocked(revisionRepository.listByEmployee).mockResolvedValue([
      {
        id: "future",
        employeeId: employee.id,
        amount: new Decimal("150000.00"),
        currencyCode: "INR",
        effectiveDate: new Date("2026-12-01T00:00:00.000Z"),
        reason: "Scheduled raise",
        createdAt: new Date("2026-11-01T00:00:00.000Z"),
      },
      {
        id: "current",
        employeeId: employee.id,
        amount: new Decimal("120000.50"),
        currencyCode: "INR",
        effectiveDate: new Date("2026-06-01T00:00:00.000Z"),
        reason: "Hire",
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
      },
    ]);

    const detail = await employeeService.get(employee.id, "2026-11-20");

    expect(detail.currentSalary).toEqual({
      amount: "120000.50",
      currencyCode: "INR",
      effectiveDate: "2026-06-01",
    });
    expect(detail.revisions.map((revision) => revision.id)).toEqual(["future", "current"]);
  });

  it("inserts the employee and the first revision with a decimal amount", async () => {
    vi.mocked(employeeRepository.insertWithRevision).mockResolvedValue({
      employeeId: "employee-1",
      revisionId: "rev-1",
    });

    const created = await employeeService.createWithInitialRevision({
      firstName: "Ava",
      lastName: "Shah",
      email: "Ava.Shah@acme.test",
      countryCode: "in",
      departmentId: "dept-1",
      levelId: "level-1",
      jobTitle: "Engineer",
      hireDate: "2020-01-15",
      amount: "120000.50",
      currencyCode: "inr",
      effectiveDate: "2020-01-15",
      reason: "Hire",
    });

    const stored = vi.mocked(employeeRepository.insertWithRevision).mock.calls[0]?.[0];
    expect(stored?.email).toBe("ava.shah@acme.test");
    expect(stored?.countryCode).toBe("IN");
    expect(stored?.amount).toBeInstanceOf(Decimal);
    expect(stored?.amount.equals("120000.50")).toBe(true);
    expect(created.amount).toBe("120000.50");
  });
});
