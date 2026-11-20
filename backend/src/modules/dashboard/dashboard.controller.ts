import { sendSuccess } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import type { DashboardQueryInput } from "./dashboard.schema";
import { dashboardService } from "./dashboard.service";

export const getDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.get(req.query as unknown as DashboardQueryInput);
  sendSuccess(res, data);
});
