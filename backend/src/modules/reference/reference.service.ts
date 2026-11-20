import { formatRate } from "../../lib/money";
import { prisma } from "../../lib/prisma";
import { utcDateString } from "../revisions/revision.rules";

export const referenceService = {
  async list() {
    const [countries, departments, levels, currencies] = await Promise.all([
      prisma.country.findMany({ orderBy: { name: "asc" } }),
      prisma.department.findMany({ orderBy: { name: "asc" } }),
      prisma.jobLevel.findMany({ orderBy: { rank: "asc" } }),
      prisma.currency.findMany({ orderBy: { code: "asc" } }),
    ]);

    return {
      countries: countries.map((country) => ({
        code: country.code.trim(),
        name: country.name,
        defaultCurrencyCode: country.defaultCurrencyCode.trim(),
      })),
      departments: departments.map((department) => ({
        id: department.id,
        name: department.name,
      })),
      levels: levels.map((level) => ({
        id: level.id,
        code: level.code,
        name: level.name,
        rank: level.rank,
      })),
      currencies: currencies.map((currency) => ({
        code: currency.code.trim(),
        name: currency.name,
        usdPerUnit: formatRate(currency.usdPerUnit),
        rateDate: utcDateString(currency.rateDate),
      })),
    };
  },
};
