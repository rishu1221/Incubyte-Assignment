import { describe, expect, it } from "vitest";
import { parseEnv } from "../src/config/env";

const validEnv = {
  NODE_ENV: "test",
  PORT: "4000",
  DATABASE_URL: "postgresql://acme:acme@localhost:5432/acme_salary",
  CORS_ORIGIN: "http://localhost:5173",
  LOG_LEVEL: "silent",
};

describe("parseEnv", () => {
  it("accepts a complete environment", () => {
    expect(parseEnv(validEnv)).toMatchObject({
      NODE_ENV: "test",
      PORT: 4000,
      DATABASE_URL: validEnv.DATABASE_URL,
      CORS_ORIGIN: "http://localhost:5173",
      LOG_LEVEL: "silent",
    });
  });

  it("rejects a missing database url", () => {
    expect(() => parseEnv({ ...validEnv, DATABASE_URL: "" })).toThrow(/Invalid environment/);
  });
});
