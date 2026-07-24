import { config } from "dotenv";
import { z } from "zod";

config();

function normalizeOrigin(value: string) {
  const trimmed = value.trim().replace(/^['"]|['"]$/g, "").replace(/\/$/, "");
  if (!trimmed) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

const csvOriginsSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);
}, z.array(z.string().url()));

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(4000),
  FRONTEND_ORIGIN: z.preprocess(
    (value) => (typeof value === "string" ? normalizeOrigin(value) : value),
    z.string().url()
  ).default("http://localhost:5173"),
  FRONTEND_ORIGINS: csvOriginsSchema.default([])
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  allowedOrigins: Array.from(new Set([parsedEnv.FRONTEND_ORIGIN, ...parsedEnv.FRONTEND_ORIGINS]))
};
