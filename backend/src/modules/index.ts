import { Router } from "express";
import { employeeRouter } from "./employees/employee.routes";
import { healthRouter } from "./health/health.routes";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/employees", employeeRouter);
