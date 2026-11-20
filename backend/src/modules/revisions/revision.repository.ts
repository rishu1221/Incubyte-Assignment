import type { Decimal } from "../../lib/decimal";
import { prisma } from "../../lib/prisma";
import { asMoney } from "../../lib/money";
import type { RevisionRecord } from "../employees/employee.types";

function mapRevision(revision: {
  id: string;
  employeeId: string;
  amount: Decimal | string;
  currencyCode: string;
  effectiveDate: Date;
  reason: string;
  createdAt: Date;
}): RevisionRecord {
  return {
    id: revision.id,
    employeeId: revision.employeeId,
    amount: asMoney(revision.amount),
    currencyCode: revision.currencyCode.trim(),
    effectiveDate: revision.effectiveDate,
    reason: revision.reason,
    createdAt: revision.createdAt,
  };
}

export const revisionRepository = {
  async findCurrency(code: string): Promise<{ code: string } | null> {
    return prisma.currency.findUnique({
      where: { code },
      select: { code: true },
    });
  },

  async listByEmployee(employeeId: string): Promise<RevisionRecord[]> {
    const revisions = await prisma.salaryRevision.findMany({
      where: { employeeId },
      orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    });
    return revisions.map(mapRevision);
  },

  async create(input: {
    employeeId: string;
    amount: Decimal;
    currencyCode: string;
    effectiveDate: Date;
    reason: string;
  }): Promise<RevisionRecord> {
    const revision = await prisma.salaryRevision.create({ data: input });
    return mapRevision(revision);
  },
};
