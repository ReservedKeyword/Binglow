import { getLocalServer } from "@binglow/http/get-server";
import { HeartbeatManager } from "@binglow/redis-heartbeat";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { Server as HttpsServer } from "https";
import { join as pathJoin } from "path";
import { serviceEnvironment } from "./integrations/environment";
import { serviceLogger } from "./integrations/logger";
import { redisClient } from "./integrations/redis-client";
import { appRouter } from "./routers";
import { createContext as createTrpcContext } from "./trpc";

(async () => {
  const { NODE_ENV, PORT, SERVICE_NAME } = serviceEnvironment;
  const dirname = import.meta.dirname ?? __dirname;
  const logger = serviceLogger.getSubLogger({ name: "Server" });
  const certificatePath = pathJoin(dirname, "../../../localhost.pem");
  const privateKeyPath = pathJoin(dirname, "../../../localhost-key.pem");

  const app = express();

  const server = await getLocalServer({
    certificatePath,
    nodeEnvironment: NODE_ENV,
    privateKeyPath,
    requestListener: app
  });

  new HeartbeatManager({
    logger: serviceLogger,
    redisClient,
    serviceName: SERVICE_NAME
  }).start();

  app.use(
    cors({
      credentials: true,
      origin: serviceEnvironment.CORS_APP_URL
    })
  );

  app.use(cookieParser());

  app.use(
    "/trpc",
    createExpressMiddleware({
      createContext: createTrpcContext,
      router: appRouter
    })
  );

  server.listen(PORT, () => {
    logger.info(`tRPC API server listening on ${server instanceof HttpsServer ? "https" : "http"}://localhost:${PORT}`);
  });
})();
