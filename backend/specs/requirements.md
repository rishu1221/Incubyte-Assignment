# ACME Salary Management — Requirements

**Persona:** HR Manager at ACME  
**Scale:** 10,000 employees, multiple countries  
**Status:** Agreed before implementation

## Goal

Replace the Excel files the HR team uses today with a web application where one HR manager can keep salary data current and answer concrete questions about how ACME pays people: who earns what, where payroll sits, and how pay compares across country, department, and level.

Success means the manager can find any employee, record a salary change without losing history, and read org-wide pay answers from the same data, with all 10,000 employees loaded.

## Scope

One HR-facing product, end to end: a PostgreSQL database, an Express API, a React UI, a seed of 10,000 employees, automated tests around the core rules, and a deployed build with a short demo.

The product stores **gross annual salary** in the employee’s local currency, with an effective date. Current pay is the latest revision. Older revisions stay on the record so a change is explainable later.

### In scope

1. **Employee directory.** Search by name or email. Filter by country, department, level, and employment status. Paginate so 10,000 rows stay usable.
2. **Employee salary record.** Show identity (name, country, department, title, level, status, hire date), current gross salary and currency, and the revision history (amount, currency, effective date, reason).
3. **Record a salary change.** Add a new revision. The previous amount remains in history. Reject a missing amount, a non-positive amount, an unknown currency, or an effective date that is not a real date.
4. **Pay questions (dashboard).** From the current salaries, answer:
   - Headcount and total annual payroll by country and by department, **within a single currency**.
   - Average and median salary by country, department, and level.
   - Distribution across salary bands.
   - Highest and lowest current salaries inside the active filters.
5. **Cross-country comparison.** A small, checked-in rate table converts amounts to USD for org-wide totals only. The UI labels those figures as approximate and shows the rate date. Native-currency totals stay exact.
6. **Seed.** A repeatable Prisma seed inserts 10,000 employees across several countries, departments, levels, and currencies, including a realistic spread of salaries and a few historical revisions.
7. **Tests.** Fast, deterministic unit tests for salary revision rules, filtering, pagination, and the aggregate calculations (average, median, per-currency totals, USD conversion).
8. **Delivery.** Incremental git commits, a deployed URL, and a short video of the main flows.

### Deliberately left out

| Left out | Why |
| --- | --- |
| Payroll runs, tax, deductions, net pay, payslips | ACME’s pain is managing and explaining gross pay. A payroll engine is a different product and would bury the assessment’s real scope. |
| Bonus plans, equity, benefits | Same reason. Gross base salary is enough to answer “how do we pay people?” |
| Approval chains, multiple roles, SSO | The only persona is the HR manager. A single shared login is enough to keep the app from being wide open. Role design can wait until a second persona exists. |
| Employee self-service | Employees do not view or edit their own pay in this version. |
| Live foreign-exchange feeds | Rates that change between page loads make totals non-deterministic and harder to test. A static table keeps comparisons honest and repeatable. |
| Excel as a live source, two-way sync, or bulk import | The seed replaces the spreadsheet for this exercise. Export can be added once the in-app answers are trusted. |
| Free-text or AI question answering | The questions above are known in advance. Fixed queries return the same number every time. A chat box can sound right and still be wrong. |
| Email, notifications, mobile app, audit-compliance exports | None of these help the manager answer a pay question in the first release. Salary history covers “what changed?” for a single user. |

## Prerequisites

Install and confirm these before scaffolding:

- **Git**, with a remote repository the submission link can point to.
- **Node.js 20 LTS** and npm. The API and the UI are separate Node projects.
- **PostgreSQL 16** running locally (Docker or a native install). Prisma connects with a `DATABASE_URL` in `.env`. Commit `.env.example` only; keep real credentials out of git.
- A current **Chrome** or **Edge** for local use.
- A **deploy target** that can run the Express server and a hosted PostgreSQL database. Run Prisma migrations and the seed against that database. Record the URL in the repo once it is live.
- A way to **record a 2–4 minute screen video** of directory search, a salary change, and the dashboard.

Chosen stack:

- **API:** Express with TypeScript.
- **Data:** PostgreSQL, accessed only through Prisma. Schema lives in `schema.prisma`; migrations are committed.
- **UI:** React (Vite) and a small component library. The assignment requires React or Next.js, and Express owns the API, so the interface is a separate React app that calls the API.

## Build sequence

Work in this order and commit at each step so the history shows the solution growing.

1. Commit this requirements document.
2. Write a short design note: tables, API routes, and how “current salary” is defined.
3. Scaffold the Express API and the React app. Add Prisma, the PostgreSQL schema, and the first migration.
4. Implement salary rules and aggregates with unit tests before the UI.
5. Add the seed script and verify it loads 10,000 employees.
6. Build the directory, employee record, salary-change form, and dashboard against that data.
7. Exercise the flows locally (search, filter, update, dashboard numbers).
8. Deploy, record the demo, and link both from the repository.

## Acceptance

The work is done when an HR manager can:

- Open the deployed app and see employees from the 10,000-row seed.
- Find a person by name and narrow the list by country and department.
- Save a new salary revision and see it become current while the old amount remains in history.
- Read headcount, payroll, average, median, bands, and extremes, with mixed currencies never added together as if they were the same unit.
- Point reviewers at passing unit tests, the commit history, the live URL, and the demo video.
