import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { getDashboard } from "./dashboard.controller";
import { dashboardQuerySchema } from "./dashboard.schema";

export const dashboardRouter = Router();

dashboardRouter.get("/", validate(dashboardQuerySchema, "query"), getDashboard);
