-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'TERMINATED');

-- CreateTable
CREATE TABLE "countries" (
    "code" CHAR(2) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "default_currency_code" CHAR(3) NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_levels" (
    "id" UUID NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "job_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currencies" (
    "code" CHAR(3) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "usd_per_unit" DECIMAL(18,8) NOT NULL,
    "rate_date" DATE NOT NULL,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "country_code" CHAR(2) NOT NULL,
    "department_id" UUID NOT NULL,
    "level_id" UUID NOT NULL,
    "job_title" VARCHAR(120) NOT NULL,
    "status" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "hire_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_revisions" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency_code" CHAR(3) NOT NULL,
    "effective_date" DATE NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salary_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "job_levels_code_key" ON "job_levels"("code");

-- CreateIndex
CREATE UNIQUE INDEX "job_levels_rank_key" ON "job_levels"("rank");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE INDEX "salary_revisions_employee_id_effective_date_created_at_id_idx" ON "salary_revisions"("employee_id", "effective_date" DESC, "created_at" DESC, "id" DESC);

-- AddForeignKey
ALTER TABLE "countries" ADD CONSTRAINT "countries_default_currency_code_fkey" FOREIGN KEY ("default_currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "countries"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "job_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_revisions" ADD CONSTRAINT "salary_revisions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_revisions" ADD CONSTRAINT "salary_revisions_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Checks Prisma cannot express. These keep non-positive pay and rates out of the database.
ALTER TABLE "salary_revisions" ADD CONSTRAINT "salary_revisions_amount_positive" CHECK ("amount" > 0);

ALTER TABLE "currencies" ADD CONSTRAINT "currencies_usd_per_unit_positive" CHECK ("usd_per_unit" > 0);

ALTER TABLE "job_levels" ADD CONSTRAINT "job_levels_rank_positive" CHECK ("rank" > 0);
