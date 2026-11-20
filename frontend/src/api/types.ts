export type EmploymentStatus = "ACTIVE" | "ON_LEAVE" | "TERMINATED";

export type Salary = {
  amount: string;
  currencyCode: string;
  effectiveDate: string;
};

export type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  status: EmploymentStatus;
  hireDate: string;
  country: { code: string; name: string };
  department: { id: string; name: string };
  level: { id: string; code: string; name: string; rank: number };
  currentSalary: Salary | null;
};

export type Revision = {
  id: string;
  amount: string;
  currencyCode: string;
  effectiveDate: string;
  reason: string;
  createdAt: string;
};

export type EmployeeDetail = Employee & {
  revisions: Revision[];
};

export type EmployeePage = {
  items: Employee[];
  page: number;
  pageSize: number;
  total: number;
};

export type ReferenceData = {
  countries: Array<{ code: string; name: string; defaultCurrencyCode: string }>;
  departments: Array<{ id: string; name: string }>;
  levels: Array<{ id: string; code: string; name: string; rank: number }>;
  currencies: Array<{ code: string; name: string; usdPerUnit: string; rateDate: string }>;
};

export type MoneyGroup = {
  headcount: number;
  total: string;
  average: string | null;
  median: string | null;
  currencyCode: string;
};

export type NamedGroup = MoneyGroup & {
  id: string;
  code: string | null;
  name: string;
  rank: number | null;
  countryCode?: string;
};

export type Extreme = {
  employeeId: string;
  name: string;
  currencyCode: string;
  amount: string;
  usdAmount: string;
};

export type Dashboard = {
  population: {
    statuses: EmploymentStatus[];
    countryCode: string | null;
    departmentId: string | null;
    levelId: string | null;
    currencyCode: string | null;
    headcount: number;
  };
  byCurrency: MoneyGroup[];
  byCountry: NamedGroup[];
  byDepartment: NamedGroup[];
  byLevel: NamedGroup[];
  extremes: {
    byCurrency: Array<{ currencyCode: string; highest: Extreme | null; lowest: Extreme | null }>;
    usd: { highest: Extreme | null; lowest: Extreme | null };
  };
  usd: MoneyGroup & {
    approximate: true;
    rateDate: string | null;
    currencyCode?: string;
  };
  bands: Array<{ label: string; min: string | null; max: string | null; headcount: number }>;
};
