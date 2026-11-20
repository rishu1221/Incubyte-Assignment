import { sendSuccess } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { healthService } from "./health.service";

export const getHealth = asyncHandler(async (_req, res) => {
  const report = await healthService.check();
  if (report.database === "down") {
    res.status(503).json({
      success: false,
      error: "Database unavailable",
      data: report,
    });
    return;
  }
  sendSuccess(res, report);
});
