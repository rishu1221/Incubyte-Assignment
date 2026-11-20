import { sendSuccess } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { revisionService } from "../revisions/revision.service";
import type { CreateRevisionBody, ListEmployeesQuery } from "./employee.schema";
import { employeeService } from "./employee.service";

export const listEmployees = asyncHandler(async (req, res) => {
  const data = await employeeService.list(req.query as unknown as ListEmployeesQuery);
  sendSuccess(res, data);
});

export const getEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const data = await employeeService.get(id);
  sendSuccess(res, data);
});

export const createRevision = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const data = await revisionService.create(id, req.body as CreateRevisionBody);
  sendSuccess(res, data, 201);
});
