import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const serviceEnvironment = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: {
    APP_URL: process.env["APP_URL"],
    BOT_SECRET: process.env["BOT_SECRET"],
    DATABASE_URL: process.env["DATABASE_URL"],
    NODE_ENV: process.env["NODE_ENV"],
    REDIS_URL: process.env["REDIS_URL"],
    RPC_URL: process.env["RPC_URL"],
    SECRET_STORE_ENCRYPTION_KEY: process.env["SECRET_STORE_ENCRYPTION_KEY"],
    SERVICE_NAME: process.env["SERVICE_NAME"],
    TWITCH_APP_CLIENT_ID: process.env["TWITCH_APP_CLIENT_ID"],
    TWITCH_APP_CLIENT_SECRET: process.env["TWITCH_APP_CLIENT_SECRET"],
    TWITCH_BOT_USERNAME: process.env["TWITCH_BOT_USERNAME"]
  },
  server: {
    APP_URL: z.url(),
    BOT_SECRET: z.string().min(16),
    DATABASE_URL: z.url(),
    NODE_ENV: z.enum(["development", "production"]).default("production"),
    REDIS_URL: z.string().optional(),
    RPC_URL: z.url(),
    SECRET_STORE_ENCRYPTION_KEY: z.string().length(32),
    SERVICE_NAME: z.string(),
    TWITCH_APP_CLIENT_ID: z.string(),
    TWITCH_APP_CLIENT_SECRET: z.string(),
    TWITCH_BOT_USERNAME: z.string()
  },
  skipValidation: !!process.env["SKIP_ENV_VALIDATION"]
});
