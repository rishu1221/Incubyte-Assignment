import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { createRevision, getEmployee, listEmployees } from "./employee.controller";
import { createRevisionSchema, employeeIdSchema, listEmployeesQuerySchema } from "./employee.schema";

export const employeeRouter = Router();

employeeRouter.get("/", validate(listEmployeesQuerySchema, "query"), listEmployees);
employeeRouter.get("/:id", validate(employeeIdSchema, "params"), getEmployee);
employeeRouter.post(
  "/:id/revisions",
  validate(employeeIdSchema, "params"),
  validate(createRevisionSchema),
  createRevision,
);
