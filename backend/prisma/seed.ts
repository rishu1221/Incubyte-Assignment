import { EmploymentStatus, Prisma, PrismaClient } from "@prisma/client";
import { Decimal } from "../src/lib/decimal";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();
const RATE_DATE = new Date("2026-01-01T00:00:00.000Z");
const EMPLOYEE_COUNT = 10_000;
const MEAN_USD = 20_000;
const DEVIATION_USD = 5_000;

const currencies = [
  { code: "USD", name: "US Dollar", usdPerUnit: "1.00000000" },
  { code: "EUR", name: "Euro", usdPerUnit: "1.08000000" },
  { code: "GBP", name: "British Pound", usdPerUnit: "1.27000000" },
  { code: "INR", name: "Indian Rupee", usdPerUnit: "0.01200000" },
  { code: "SGD", name: "Singapore Dollar", usdPerUnit: "0.74000000" },
  { code: "BRL", name: "Brazilian Real", usdPerUnit: "0.18000000" },
];

const countries = [
  { code: "US", name: "United States", defaultCurrencyCode: "USD" },
  { code: "DE", name: "Germany", defaultCurrencyCode: "EUR" },
  { code: "GB", name: "United Kingdom", defaultCurrencyCode: "GBP" },
  { code: "IN", name: "India", defaultCurrencyCode: "INR" },
  { code: "SG", name: "Singapore", defaultCurrencyCode: "SGD" },
  { code: "BR", name: "Brazil", defaultCurrencyCode: "BRL" },
];

const departments = ["Engineering", "Product", "Sales", "People", "Finance", "Operations"].map((name) => ({
  id: randomUUID(),
  name,
}));

const levels = [
  { code: "L1", name: "Associate", rank: 1 },
  { code: "L2", name: "Mid", rank: 2 },
  { code: "L3", name: "Senior", rank: 3 },
  { code: "L4", name: "Staff", rank: 4 },
  { code: "L5", name: "Principal", rank: 5 },
  { code: "L6", name: "Director", rank: 6 },
].map((level) => ({ ...level, id: randomUUID() }));

const titlesByDepartment: Record<string, string[]> = {
  Engineering: ["Software Engineer", "QA Engineer", "Data Engineer", "DevOps Engineer"],
  Product: ["Product Manager", "Product Designer", "Business Analyst", "UX Researcher"],
  Sales: ["Account Executive", "Sales Associate", "Customer Success Manager", "Solutions Consultant"],
  People: ["HR Generalist", "Recruiter", "People Partner", "Learning Specialist"],
  Finance: ["Accountant", "Financial Analyst", "Payroll Specialist", "Controller"],
  Operations: ["Operations Coordinator", "Office Manager", "Supply Planner", "Project Coordinator"],
};

const namesByCountry: Record<string, { first: string[]; last: string[] }> = {
  US: {
    first: ["James", "Olivia", "William", "Emma", "Benjamin", "Charlotte", "Henry", "Amelia", "Daniel", "Sophia", "Michael", "Grace", "Joseph", "Hannah", "Andrew", "Natalie"],
    last: ["Johnson", "Williams", "Brown", "Miller", "Davis", "Wilson", "Anderson", "Taylor", "Thomas", "Moore", "Jackson", "Martin", "Thompson", "Harris", "Clark", "Lewis"],
  },
  GB: {
    first: ["Oliver", "Amelia", "George", "Isla", "Harry", "Freya", "Jack", "Poppy", "Charlie", "Emily", "Thomas", "Sophie", "Edward", "Lucy", "Arthur", "Grace"],
    last: ["Smith", "Jones", "Taylor", "Brown", "Davies", "Wilson", "Evans", "Thomas", "Roberts", "Walker", "Wright", "Thompson", "Robinson", "Campbell", "Clarke", "Hughes"],
  },
  DE: {
    first: ["Lukas", "Anna", "Finn", "Mia", "Leon", "Emma", "Paul", "Hannah", "Jonas", "Lena", "Elias", "Marie", "Ben", "Laura", "Felix", "Clara"],
    last: ["Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Hoffmann", "Koch", "Bauer", "Richter", "Klein", "Wolf", "Neumann", "Schwarz"],
  },
  IN: {
    first: ["Aarav", "Ananya", "Vihaan", "Diya", "Aditya", "Isha", "Kabir", "Meera", "Arjun", "Saanvi", "Rohan", "Anika", "Vikram", "Priya", "Rahul", "Neha"],
    last: ["Sharma", "Patel", "Singh", "Reddy", "Iyer", "Nair", "Gupta", "Mehta", "Joshi", "Kapoor", "Desai", "Rao", "Banerjee", "Das", "Menon", "Kulkarni"],
  },
  SG: {
    first: ["Wei Ming", "Jia Hui", "Amir", "Nurul", "Arun", "Rachel", "Jun Hao", "Mei Ling", "Hafiz", "Siti", "Ethan", "Chloe", "Daniel", "Priya", "Marcus", "Aisha"],
    last: ["Tan", "Lim", "Lee", "Ng", "Ong", "Wong", "Goh", "Chua", "Rahman", "Abdullah", "Kumar", "Koh", "Chan", "Teo", "Chen", "Pillai"],
  },
  BR: {
    first: ["Gabriel", "Ana", "Lucas", "Maria", "Pedro", "Beatriz", "Rafael", "Julia", "Bruno", "Camila", "Felipe", "Fernanda", "Gustavo", "Amanda", "Mateus", "Larissa"],
    last: ["Silva", "Santos", "Oliveira", "Souza", "Pereira", "Costa", "Rodrigues", "Almeida", "Ferreira", "Gomes", "Martins", "Barbosa", "Ribeiro", "Carvalho", "Lima", "Araujo"],
  },
};

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let next = Math.imul(state ^ (state >>> 15), 1 | state);
    next = (next + Math.imul(next ^ (next >>> 7), 61 | next)) ^ next;
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: readonly T[], random: () => number): T {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) {
    throw new Error("Cannot pick from an empty list");
  }
  return item;
}

/** Annual USD pay, normal distribution around $20,000 with a $5,000 standard deviation. */
function sampleAnnualUsd(random: () => number): Decimal {
  let usd = 0;
  do {
    const u1 = Math.max(random(), 1e-12);
    const u2 = random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    usd = MEAN_USD + z * DEVIATION_USD;
  } while (usd <= 0);
  return new Decimal(usd.toFixed(2));
}

function toLocal(usd: Decimal, usdPerUnit: string): Decimal {
  return usd.div(usdPerUnit).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

function dateYearsAgo(years: number, dayOffset: number): Date {
  const date = new Date(Date.UTC(2026 - years, 0, 1));
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date;
}

function asciiEmailLocal(firstName: string, lastName: string): string {
  return `${firstName}.${lastName}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z.]+/g, "");
}

function uniqueEmail(firstName: string, lastName: string, used: Set<string>): string {
  const local = asciiEmailLocal(firstName, lastName);
  let email = `${local}@acme.test`;
  let suffix = 2;
  while (used.has(email)) {
    email = `${local}.${suffix}@acme.test`;
    suffix += 1;
  }
  used.add(email);
  return email;
}

async function main(): Promise<void> {
  const random = mulberry32(20261120);
  const usedEmails = new Set<string>();

  await prisma.salaryRevision.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.country.deleteMany();
  await prisma.jobLevel.deleteMany();
  await prisma.department.deleteMany();
  await prisma.currency.deleteMany();

  await prisma.currency.createMany({
    data: currencies.map((currency) => ({ ...currency, rateDate: RATE_DATE })),
  });
  await prisma.country.createMany({ data: countries });
  await prisma.department.createMany({ data: departments });
  await prisma.jobLevel.createMany({
    data: levels.map(({ id, code, name, rank }) => ({ id, code, name, rank })),
  });

  const employees: Prisma.EmployeeCreateManyInput[] = [];
  const revisions: Prisma.SalaryRevisionCreateManyInput[] = [];
  let usdSum = new Decimal(0);
  let usdSumSquares = new Decimal(0);

  for (let index = 0; index < EMPLOYEE_COUNT; index += 1) {
    const country = pick(countries, random);
    const currency = currencies.find((item) => item.code === country.defaultCurrencyCode);
    const namePool = namesByCountry[country.code];
    if (!currency || !namePool) {
      throw new Error(`Missing currency or names for ${country.code}`);
    }
    const level = pick(levels, random);
    const department = pick(departments, random);
    const firstName = pick(namePool.first, random);
    const lastName = pick(namePool.last, random);
    const employeeId = randomUUID();
    const statusRoll = random();
    const status: EmploymentStatus =
      statusRoll < 0.04 ? EmploymentStatus.TERMINATED : statusRoll < 0.08 ? EmploymentStatus.ON_LEAVE : EmploymentStatus.ACTIVE;
    const hireDate = dateYearsAgo(1 + Math.floor(random() * 8), Math.floor(random() * 330));
    const currentUsd = sampleAnnualUsd(random);
    const currentLocal = toLocal(currentUsd, currency.usdPerUnit);
    const hadReview = random() < 0.35;
    const starting = hadReview
      ? currentLocal.div("1.06").toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
      : currentLocal;

    usdSum = usdSum.plus(currentUsd);
    usdSumSquares = usdSumSquares.plus(currentUsd.mul(currentUsd));

    employees.push({
      id: employeeId,
      firstName,
      lastName,
      email: uniqueEmail(firstName, lastName, usedEmails),
      countryCode: country.code,
      departmentId: department.id,
      levelId: level.id,
      jobTitle: pick(titlesByDepartment[department.name] ?? ["Specialist"], random),
      status,
      hireDate,
    });

    revisions.push({
      id: randomUUID(),
      employeeId,
      amount: starting,
      currencyCode: currency.code,
      effectiveDate: hireDate,
      reason: "Hire",
      createdAt: hireDate,
    });

    if (hadReview) {
      const effectiveDate = dateYearsAgo(0, 40 + Math.floor(random() * 200));
      revisions.push({
        id: randomUUID(),
        employeeId,
        amount: currentLocal,
        currencyCode: currency.code,
        effectiveDate,
        reason: "Annual review",
        createdAt: new Date(effectiveDate.getTime() - 86_400_000),
      });
    }

    if (random() < 0.02) {
      revisions.push({
        id: randomUUID(),
        employeeId,
        amount: currentLocal.mul("1.04").toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
        currencyCode: currency.code,
        effectiveDate: new Date("2026-12-01T00:00:00.000Z"),
        reason: "Scheduled raise",
        createdAt: new Date("2026-11-01T00:00:00.000Z"),
      });
    }
  }

  for (let offset = 0; offset < employees.length; offset += 1000) {
    await prisma.employee.createMany({ data: employees.slice(offset, offset + 1000) });
  }
  for (let offset = 0; offset < revisions.length; offset += 1000) {
    await prisma.salaryRevision.createMany({ data: revisions.slice(offset, offset + 1000) });
  }

  const mean = usdSum.div(EMPLOYEE_COUNT);
  const variance = usdSumSquares.div(EMPLOYEE_COUNT).minus(mean.mul(mean));
  const [employeeCount, revisionCount] = await Promise.all([
    prisma.employee.count(),
    prisma.salaryRevision.count(),
  ]);
  console.log(
    `Seeded ${employeeCount} employees and ${revisionCount} salary revisions. Current USD mean ${mean.toFixed(2)}, deviation ${variance.sqrt().toFixed(2)}.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
