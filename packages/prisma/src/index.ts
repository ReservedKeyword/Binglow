import { PrismaClient } from "./generated/client";

export interface PrismaClientOptions {
  nodeEnvironment?: "development" | "production" | undefined;
}

export const getPrismaClient = (options?: PrismaClientOptions): PrismaClient =>
  new PrismaClient({ log: options?.nodeEnvironment === "development" ? ["error", "warn"] : ["error"] });
