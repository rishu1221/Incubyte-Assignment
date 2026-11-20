import { logger, errorContext } from "../../utils/logger";
import { healthRepository } from "./health.repository";

export type HealthReport = {
  status: "ok" | "degraded";
  database: "up" | "down";
};

export const healthService = {
  async check(): Promise<HealthReport> {
    try {
      await healthRepository.ping();
      return { status: "ok", database: "up" };
    } catch (error) {
      logger.error("Database health check failed", errorContext(error));
      return { status: "degraded", database: "down" };
    }
  },
};
