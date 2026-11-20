import { z } from "zod";

export const dashboardQuerySchema = z.object({
  country: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "Country must be a 2-letter ISO code")
    .optional(),
  departmentId: z.string().uuid().optional(),
  levelId: z.string().uuid().optional(),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Currency must be a 3-letter ISO code")
    .optional(),
  status: z.enum(["ACTIVE", "ON_LEAVE", "TERMINATED"]).optional(),
});

export type DashboardQueryInput = z.infer<typeof dashboardQuerySchema>;
