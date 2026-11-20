import { createServer } from "node:http";
import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";
import { errorContext, logger } from "./utils/logger";

const app = createApp();
const server = createServer(app);

server.listen(env.PORT, () => {
  logger.info("API listening", { port: env.PORT });
});

function shutdown(signal: string): void {
  logger.info("Shutting down", { signal });
  server.close(() => {
    prisma
      .$disconnect()
      .then(() => {
        process.exit(0);
      })
      .catch((error: unknown) => {
        logger.error("Error disconnecting Prisma", errorContext(error));
        process.exit(1);
      });
  });
}

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", errorContext(reason));
});
