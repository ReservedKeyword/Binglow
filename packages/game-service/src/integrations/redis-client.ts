import { RedisClient } from "@binglow/redis";
import { serviceEnvironment } from "./environment";
import { serviceLogger } from "./logger";

const { REDIS_URL } = serviceEnvironment;

export const redisClient = new RedisClient({
  logger: serviceLogger,
  url: REDIS_URL
});
