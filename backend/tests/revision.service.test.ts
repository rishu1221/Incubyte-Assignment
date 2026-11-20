import { Decimal } from "../src/lib/decimal";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/modules/employees/employee.repository", () => ({
  employeeRepository: {
    exists: vi.fn(),
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
import { revisionRepository } from "../src/modules/revisions/revision.repository";
import { revisionService } from "../src/modules/revisions/revision.service";

describe("revisionService.create", () => {
  beforeEach(() => {
    vi.mocked(employeeRepository.exists).mockReset();
    vi.mocked(revisionRepository.findCurrency).mockReset();
    vi.mocked(revisionRepository.create).mockReset();
  });

  it("stores a decimal amount and leaves older revisions untouched", async () => {
    vi.mocked(employeeRepository.exists).mockResolvedValue(true);
    vi.mocked(revisionRepository.findCurrency).mockResolvedValue({ code: "INR" });
    vi.mocked(revisionRepository.create).mockImplementation(async (input) => ({
      id: "rev-1",
      employeeId: input.employeeId,
      amount: input.amount,
      currencyCode: input.currencyCode,
      effectiveDate: input.effectiveDate,
      reason: input.reason,
      createdAt: new Date("2026-11-20T09:00:00.000Z"),
    }));

    const created = await revisionService.create("employee-1", {
      amount: "120000.50",
      currencyCode: "inr",
      effectiveDate: "2026-12-01",
      reason: "Promotion",
    });

    const stored = vi.mocked(revisionRepository.create).mock.calls[0]?.[0];
    expect(stored?.amount).toBeInstanceOf(Decimal);
    expect(stored?.amount.equals("120000.50")).toBe(true);
    expect(stored?.currencyCode).toBe("INR");
    expect(created.amount).toBe("120000.50");
    expect(created.effectiveDate).toBe("2026-12-01");
  });

  it("rejects an invalid amount before looking up the employee", async () => {
    await expect(
      revisionService.create("employee-1", {
        amount: "10.999",
        currencyCode: "INR",
        effectiveDate: "2026-12-01",
        reason: "Correction",
      }),
    ).rejects.toThrow(/2 decimal places/);

    expect(employeeRepository.exists).not.toHaveBeenCalled();
    expect(revisionRepository.create).not.toHaveBeenCalled();
  });

  it("rejects an unknown currency", async () => {
    vi.mocked(employeeRepository.exists).mockResolvedValue(true);
    vi.mocked(revisionRepository.findCurrency).mockResolvedValue(null);

    await expect(
      revisionService.create("employee-1", {
        amount: "1000.00",
        currencyCode: "XYZ",
        effectiveDate: "2026-12-01",
        reason: "Correction",
      }),
    ).rejects.toThrow(/Unknown currency/);

    expect(revisionRepository.create).not.toHaveBeenCalled();
  });
});
