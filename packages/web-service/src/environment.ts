import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const webServiceEnvironment = createEnv({
  client: {
    NEXT_PUBLIC_RPC_URL: z.url(),
    NEXT_PUBLIC_WS_URL: z.url()
  },
  emptyStringAsUndefined: true,
  runtimeEnv: {
    DATABASE_URL: process.env["DATABASE_URL"],
    NEXTAUTH_SECRET: process.env["NEXTAUTH_SECRET"],
    NEXTAUTH_URL: process.env["NEXTAUTH_URL"],
    NEXT_PUBLIC_RPC_URL: process.env["NEXT_PUBLIC_RPC_URL"],
    NEXT_PUBLIC_WS_URL: process.env["NEXT_PUBLIC_WS_URL"],
    NODE_ENV: process.env["NODE_ENV"],
    TWITCH_APP_CLIENT_ID: process.env["TWITCH_APP_CLIENT_ID"],
    TWITCH_APP_CLIENT_SECRET: process.env["TWITCH_APP_CLIENT_SECRET"]
  },
  server: {
    DATABASE_URL: z.url(),
    NEXTAUTH_SECRET: z.string(),
    NEXTAUTH_URL: z.url(),
    NODE_ENV: z.enum(["development", "production"]).default("production"),
    TWITCH_APP_CLIENT_ID: z.string(),
    TWITCH_APP_CLIENT_SECRET: z.string()
  },
  skipValidation: !!process.env["SKIP_ENV_VALIDATION"]
});
