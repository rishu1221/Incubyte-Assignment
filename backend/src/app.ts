import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { allowedOrigins, env } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import { notFound } from "./middlewares/notFound";
import { apiRateLimiter } from "./middlewares/rateLimiter";
import { requestLogger } from "./middlewares/requestLogger";
import { apiRouter } from "./modules";

export function createApp(): Express {
  const app = express();

  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: allowedOrigins(env.CORS_ORIGIN) }));
  app.use(express.json({ limit: "1mb" }));

  if (env.NODE_ENV !== "test") {
    app.use(requestLogger);
  }

  app.use("/api/v1", apiRateLimiter, apiRouter);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
