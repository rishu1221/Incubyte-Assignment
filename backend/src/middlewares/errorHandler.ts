import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { env } from "../config/env";
import { MoneyError } from "../lib/money";
import { AppError } from "../utils/AppError";
import { errorContext, logger } from "../utils/logger";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof MoneyError) {
    res.status(400).json({ success: false, error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      details: err.flatten(),
    });
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ success: false, error: "Invalid JSON" });
    return;
  }

  if (err instanceof AppError) {
    if (!err.isOperational || err.statusCode >= 500) {
      logger.error(err.message, errorContext(err));
    }
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }

  logger.error("Unhandled error", errorContext(err));
  const message =
    env.NODE_ENV === "production" || !(err instanceof Error) ? "Internal server error" : err.message;
  res.status(500).json({ success: false, error: message });
};
