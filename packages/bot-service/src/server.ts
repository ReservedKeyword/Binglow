import { RedisClient } from "@binglow/redis";
import { HeartbeatManager } from "@binglow/redis-heartbeat";
import { PrismaSecretStore } from "@binglow/secret-store/PrismaSecretStore";
import { BotState } from "./BotState";
import { serviceEnvironment } from "./integrations/environment";
import { serviceLogger } from "./integrations/logger";
import { prismaClient } from "./integrations/prisma-client";
import { RedisSubscriber } from "./RedisSubscriber";
import { TwitchClient } from "./TwitchClient";

const {
  APP_URL,
  REDIS_URL,
  SECRET_STORE_ENCRYPTION_KEY,
  SERVICE_NAME,
  TWITCH_APP_CLIENT_ID,
  TWITCH_APP_CLIENT_SECRET
} = serviceEnvironment;

const botState = new BotState();

const redisClient = new RedisClient({
  logger: serviceLogger,
  url: REDIS_URL
});

const twitchClient = new TwitchClient({
  appUrl: APP_URL,
  authOptions: {
    clientId: TWITCH_APP_CLIENT_ID,
    clientSecret: TWITCH_APP_CLIENT_SECRET,
    logger: serviceLogger,
    secretStore: new PrismaSecretStore({
      encryptionKey: SECRET_STORE_ENCRYPTION_KEY,
      prismaClient
    })
  },
  botState,
  logger: serviceLogger
});

new HeartbeatManager({
  logger: serviceLogger,
  redisClient,
  serviceName: SERVICE_NAME
}).start();

(async () => {
  await twitchClient.initClient();
  await twitchClient.joinInitialChannels();
  serviceLogger.info("Bot successfully initialized and connected to Twitch IRC!");
  const underlyingTwitchClient = twitchClient.getUnderlyingClient();

  if (!underlyingTwitchClient) {
    serviceLogger.error("Unable to get underlying Twitch (tmi.js) client, exiting process...");
    return process.exit(1);
  }

  const redisSubscriber = new RedisSubscriber({
    botState,
    logger: serviceLogger,
    redisClient,
    twitchClient: underlyingTwitchClient
  });

  redisSubscriber.initializeSubscriptions();
  serviceLogger.info("Bot is now listening for new messages...");
})();
