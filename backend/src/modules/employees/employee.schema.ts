import { z } from "zod";

export const listEmployeesQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "Country must be a 2-letter ISO code")
    .optional(),
  departmentId: z.string().uuid().optional(),
  levelId: z.string().uuid().optional(),
  status: z.enum(["ACTIVE", "ON_LEAVE", "TERMINATED"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const employeeIdSchema = z.object({
  id: z.string().uuid(),
});

export const createRevisionSchema = z.object({
  amount: z.string().trim().min(1),
  currencyCode: z.string().trim().min(1),
  effectiveDate: z.string().trim().min(1),
  reason: z.string().trim().min(1).max(500),
});

export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;
export type CreateRevisionBody = z.infer<typeof createRevisionSchema>;
