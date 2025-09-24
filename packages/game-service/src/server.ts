import { getLocalServer } from "@binglow/http/get-server";
import { HeartbeatManager } from "@binglow/redis-heartbeat";
import { Server as HttpsServer } from "https";
import { join as pathJoin } from "path";
import { WebSocketServer } from "ws";
import { GameManager } from "./GameManager";
import { serviceEnvironment } from "./integrations/environment";
import { serviceLogger } from "./integrations/logger";
import { redisClient } from "./integrations/redis-client";

(async () => {
  const { NODE_ENV, PORT, SERVICE_NAME } = serviceEnvironment;
  const dirname = import.meta.dirname ?? __dirname;
  const certificatePath = pathJoin(dirname, "../../../localhost.pem");
  const privateKeyPath = pathJoin(dirname, "../../../localhost-key.pem");

  const server = await getLocalServer({
    certificatePath,
    nodeEnvironment: NODE_ENV,
    privateKeyPath
  });

  const logger = serviceLogger.getSubLogger({ name: "Server" });
  const gameManager = new GameManager();
  const wss = new WebSocketServer({ server });

  new HeartbeatManager({
    logger: serviceLogger,
    redisClient,
    serviceName: SERVICE_NAME
  }).start();

  wss.on("connection", (ws) => gameManager.handleConnection(ws));

  server.listen(PORT, () => {
    logger.info(`WebSocket server started on ${server instanceof HttpsServer ? "wss" : "ws"}://localhost:${PORT}`);
  });
})();
