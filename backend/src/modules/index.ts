import { Router } from "express";
import { dashboardRouter } from "./dashboard/dashboard.routes";
import { employeeRouter } from "./employees/employee.routes";
import { healthRouter } from "./health/health.routes";
import { referenceRouter } from "./reference/reference.routes";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/reference", referenceRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/employees", employeeRouter);
