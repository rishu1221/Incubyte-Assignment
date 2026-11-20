import { sendSuccess } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { referenceService } from "./reference.service";

export const listReference = asyncHandler(async (_req, res) => {
  sendSuccess(res, await referenceService.list());
});
