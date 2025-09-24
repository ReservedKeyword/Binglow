import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const serviceEnvironment = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: {
    NODE_ENV: process.env["NODE_ENV"],
    PORT: process.env["PORT"],
    REDIS_URL: process.env["REDIS_URL"],
    SERVICE_NAME: process.env["SERVICE_NAME"]
  },
  server: {
    NODE_ENV: z.enum(["development", "production"]).default("production"),
    PORT: z.coerce.number().default(3000),
    REDIS_URL: z.string().optional(),
    SERVICE_NAME: z.string()
  },
  skipValidation: !!process.env["SKIP_VALIDATION"]
});
