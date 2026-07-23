import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(4000),
  FRONTEND_ORIGIN: z.string().default("http://localhost:5173")
});

export const env = envSchema.parse(process.env);

