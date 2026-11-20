import type { RequestHandler } from "express";
import { logger } from "../utils/logger";

export const requestLogger: RequestHandler = (req, res, next) => {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    logger.info("request completed", {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(1)),
    });
  });

  next();
};
