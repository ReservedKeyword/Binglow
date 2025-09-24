import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const serviceEnvironment = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: {
    DATABASE_URL: process.env["DATABASE_URL"],
    NODE_ENV: process.env["NODE_ENV"],
    PORT: process.env["PORT"],
    SECRET_STORE_ENCRYPTION_KEY: process.env["SECRET_STORE_ENCRYPTION_KEY"],
    TWITCH_APP_CLIENT_ID: process.env["TWITCH_APP_CLIENT_ID"],
    TWITCH_APP_CLIENT_SECRET: process.env["TWITCH_APP_CLIENT_SECRET"],
    TWITCH_OAUTH_REDIRECT_URI: process.env["TWITCH_OAUTH_REDIRECT_URI"]
  },
  server: {
    DATABASE_URL: z.url(),
    NODE_ENV: z.enum(["development", "production"]).default("production"),
    PORT: z.coerce.number().optional().default(3000),
    SECRET_STORE_ENCRYPTION_KEY: z.string(),
    TWITCH_APP_CLIENT_ID: z.string(),
    TWITCH_APP_CLIENT_SECRET: z.string(),
    TWITCH_OAUTH_REDIRECT_URI: z.string()
  },
  skipValidation: !!process.env["SKIP_ENV_VALIDATION"]
});
