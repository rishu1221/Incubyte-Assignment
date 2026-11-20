import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      NODE_ENV: "test",
      PORT: "4000",
      DATABASE_URL: "postgresql://acme:acme@localhost:5432/acme_salary?schema=public",
      CORS_ORIGIN: "http://localhost:5173",
      LOG_LEVEL: "silent",
    },
  },
});
