import { runHealthCheck } from "@binglow/redis-heartbeat";
import { serviceEnvironment } from "./integrations/environment";

const { REDIS_URL, SERVICE_NAME } = serviceEnvironment;

(async () => {
  await runHealthCheck({
    logger: console,
    redisUrl: REDIS_URL,
    serviceName: SERVICE_NAME
  });
})();
