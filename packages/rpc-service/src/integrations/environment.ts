import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const serviceEnvironment = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: {
    BOT_SECRET: process.env["BOT_SECRET"],
    CORS_APP_URL: process.env["CORS_APP_URL"],
    DATABASE_URL: process.env["DATABASE_URL"],
    NODE_ENV: process.env["NODE_ENV"],
    REDIS_URL: process.env["REDIS_URL"],
    PORT: process.env["PORT"],
    SERVICE_NAME: process.env["SERVICE_NAME"]
  },
  server: {
    BOT_SECRET: z.string().min(16),
    CORS_APP_URL: z.url(),
    DATABASE_URL: z.url(),
    NODE_ENV: z.enum(["development", "production"]).default("production"),
    REDIS_URL: z.string().optional(),
    PORT: z.coerce.number().default(3000),
    SERVICE_NAME: z.string()
  },
  skipValidation: !!process.env["SKIP_VALIDATION"]
});
