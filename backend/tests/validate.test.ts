import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { errorHandler } from "../src/middlewares/errorHandler";
import { validate } from "../src/middlewares/validate";

describe("validate", () => {
  const app = express();
  app.use(express.json());
  app.post(
    "/echo",
    validate(z.object({ name: z.string().min(1) })),
    (req, res) => {
      res.json({ success: true, data: req.body });
    },
  );
  app.use(errorHandler);

  it("passes a valid body through", async () => {
    const response = await request(app).post("/echo").send({ name: "Ava" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: { name: "Ava" } });
  });

  it("returns 400 when the body is invalid", async () => {
    const response = await request(app).post("/echo").send({ name: "" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Validation failed");
  });
});
