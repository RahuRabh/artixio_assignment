import { config } from "dotenv";
import { z } from "zod";

config();

const csvOriginsSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}, z.array(z.string().url()));

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(4000),
  FRONTEND_ORIGIN: z.string().url().default("http://localhost:5173"),
  FRONTEND_ORIGINS: csvOriginsSchema.default([])
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  allowedOrigins: Array.from(new Set([parsedEnv.FRONTEND_ORIGIN, ...parsedEnv.FRONTEND_ORIGINS]))
};
