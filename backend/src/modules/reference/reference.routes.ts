import { Router } from "express";
import { listReference } from "./reference.controller";

export const referenceRouter = Router();

referenceRouter.get("/", listReference);
