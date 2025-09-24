import { logger } from "@binglow/logger";
import { RedisClient } from "@binglow/redis";
import { serviceEnvironment } from "./environment";

const { REDIS_URL } = serviceEnvironment;

export const redisClient = new RedisClient({
  logger,
  url: REDIS_URL
});
