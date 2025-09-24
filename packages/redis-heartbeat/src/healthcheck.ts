import type { AppLogger } from "@binglow/logger";
import { RedisClient } from "@binglow/redis";
import type { HeartbeatPayload } from "./HeartbeatManager";

export interface HealthCheckOptions {
  keyPrefix?: string | undefined;
  logger: AppLogger | typeof console;
  redisUrl?: string | undefined;
  serviceName: string;
  maxDelaySeconds?: number | undefined;
}

const DEFAULT_KEY_PREFIX = "service-health";

const DEFAULT_MAX_DELAY_SECONDS = 90;

export const runHealthCheck = async ({
  keyPrefix = DEFAULT_KEY_PREFIX,
  logger,
  redisUrl,
  serviceName,
  maxDelaySeconds = DEFAULT_MAX_DELAY_SECONDS
}: HealthCheckOptions) => {
  const redisClient = new RedisClient({ url: redisUrl });

  try {
    const commandClient = redisClient.getCommandClient();
    const redisKey = `${keyPrefix}:${serviceName}`;
    const rawPayload = await commandClient.get(redisKey);

    if (!rawPayload) {
      throw new Error(`Heartbeat key ${redisKey} not found in Redis.`);
    }

    const parsedPayload = JSON.parse(rawPayload) as HeartbeatPayload;
    const currentTime = new Date();
    const lastHeartbeatTime = new Date(parsedPayload.isoTimestamp);
    const timeDifference = (currentTime.getTime() - lastHeartbeatTime.getTime()) / 1000;

    logger.info(
      `Service ${serviceName} (PID: ${parsedPayload.processId}) had last heartbeat ${timeDifference.toFixed(1)}s ago.`
    );

    if (timeDifference > maxDelaySeconds) {
      throw new Error(`Heartbeat is too old! (${timeDifference.toFixed(1)}s > ${maxDelaySeconds}s)`);
    }

    logger.info(`Service "${serviceName}" is up and healthy!`);
    process.exit(0);
  } catch (err) {
    logger.error(`Service ${serviceName} is not healthy!`, err);
    process.exit(1);
  } finally {
    await redisClient.killClients();
  }
};
