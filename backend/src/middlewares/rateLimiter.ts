import rateLimit from "express-rate-limit";
import { env } from "../config/env";

export const apiRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
  handler: (_req, res) => {
    res.status(429).json({ success: false, error: "Too many requests" });
  },
});
