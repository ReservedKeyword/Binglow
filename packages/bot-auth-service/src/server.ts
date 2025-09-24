import { getLocalServer } from "@binglow/http/get-server";
import { TwitchOAuthClient } from "@binglow/oauth/TwitchOAuthClient";
import { PrismaSecretStore } from "@binglow/secret-store/PrismaSecretStore";
import express from "express";
import { join as pathJoin } from "node:path";
import { serviceEnvironment } from "./environment";
import { serviceLogger } from "./logger";
import { prismaClient } from "./prisma-client";

interface TwitchCallbackQuery {
  code: string;
  scope: string;
}

const {
  NODE_ENV,
  PORT,
  SECRET_STORE_ENCRYPTION_KEY,
  TWITCH_APP_CLIENT_ID,
  TWITCH_APP_CLIENT_SECRET,
  TWITCH_OAUTH_REDIRECT_URI
} = serviceEnvironment;

const isTwitchCallbackQuery = (obj: unknown): obj is TwitchCallbackQuery =>
  typeof (obj as TwitchCallbackQuery).code !== "undefined" && typeof (obj as TwitchCallbackQuery).scope !== "undefined";

(async () => {
  const app = express();
  const dirname = import.meta.dirname ?? __dirname;
  const certificatePath = pathJoin(dirname, "../../../localhost.pem");
  const privateKeyPath = pathJoin(dirname, "../../../localhost-key.pem");

  const server = await getLocalServer({
    certificatePath,
    nodeEnvironment: NODE_ENV,
    privateKeyPath,
    requestListener: app
  });

  const twitchOAuthClient = new TwitchOAuthClient({
    clientId: TWITCH_APP_CLIENT_ID,
    clientSecret: TWITCH_APP_CLIENT_SECRET,
    logger: serviceLogger,
    secretStore: new PrismaSecretStore({
      encryptionKey: SECRET_STORE_ENCRYPTION_KEY,
      prismaClient
    })
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/authorize", (_, res) => {
    const authorizationUrl = twitchOAuthClient.getAuthorizationUrl({
      redirectUri: TWITCH_OAUTH_REDIRECT_URI,
      scopes: ["chat:edit", "chat:read"]
    });

    return res.redirect(authorizationUrl);
  });

  app.get("/callback", async ({ query: queryParams }, res) => {
    if (!isTwitchCallbackQuery(queryParams)) {
      serviceLogger.warn(`Query parameters ${JSON.stringify(queryParams)} did not match expected from Twitch.`);
      return res.status(401).end();
    }

    await twitchOAuthClient.exchangeCodeForTokens({
      code: queryParams.code,
      redirectUri: TWITCH_OAUTH_REDIRECT_URI
    });

    return res.status(200).end();
  });

  server.listen(PORT, () => {
    serviceLogger.warn("This service should only exist for initial authorization.");
    serviceLogger.warn("Once you have successfully authorized the Twitch bot, please kill this service.");
    serviceLogger.info(`Twitch OAuth server listening on http://localhost:${PORT}`);
  });
})();
