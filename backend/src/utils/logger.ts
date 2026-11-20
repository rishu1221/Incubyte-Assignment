import winston from "winston";
import { env } from "../config/env";

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const devFormat = printf((info) => {
  const { timestamp: time, level, message, stack } = info;
  const reserved = new Set(["timestamp", "level", "message", "stack"]);
  const meta = Object.fromEntries(Object.entries(info).filter(([key]) => !reserved.has(key)));
  const suffix = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
  const stackSuffix = typeof stack === "string" ? `\n${stack}` : "";
  return `${String(time)} ${level}: ${String(message)}${suffix}${stackSuffix}`;
});

export const logger = winston.createLogger({
  level: env.LOG_LEVEL === "silent" ? "error" : env.LOG_LEVEL,
  silent: env.LOG_LEVEL === "silent",
  format:
    env.NODE_ENV === "production"
      ? combine(timestamp(), errors({ stack: true }), json())
      : combine(colorize(), timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), errors({ stack: true }), devFormat),
  transports: [new winston.transports.Console()],
  exitOnError: false,
});

export function errorContext(error: unknown): { error: string; stack?: string } | { detail: unknown } {
  if (error instanceof Error) {
    return { error: error.message, stack: error.stack };
  }
  return { detail: error };
}
