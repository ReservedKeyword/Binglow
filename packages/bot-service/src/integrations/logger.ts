import { logger as baseLogger } from "@binglow/logger";

export const serviceLogger = baseLogger.getSubLogger({ name: "Bot Service" });
