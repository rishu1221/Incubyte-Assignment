import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/modules/health/health.repository", () => ({
  healthRepository: {
    ping: vi.fn(),
  },
}));

import { createApp } from "../src/app";
import { healthRepository } from "../src/modules/health/health.repository";

const ping = vi.mocked(healthRepository.ping);

describe("GET /api/v1/health", () => {
  const app = createApp();

  beforeEach(() => {
    ping.mockReset();
  });

  it("returns ok when the database responds", async () => {
    ping.mockResolvedValue();

    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { status: "ok", database: "up" },
    });
  });

  it("returns 503 when the database is unreachable", async () => {
    ping.mockRejectedValue(new Error("connect ECONNREFUSED"));

    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(503);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Database unavailable");
    expect(response.body.data).toEqual({ status: "degraded", database: "down" });
  });
});

describe("unknown routes", () => {
  it("returns a 404 envelope", async () => {
    const response = await request(createApp()).get("/api/v1/missing");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Route not found: GET /api/v1/missing");
  });
});
