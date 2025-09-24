import { readFile as fsReadFile } from "node:fs/promises";
import { createServer as createHttpServer, Server as HttpServer, type RequestListener } from "node:http";
import { createServer as createHttpsServer, Server as HttpsServer } from "node:https";

interface GetNodeServerOptions {
  certificatePath: string;
  nodeEnvironment: "development" | "production";
  privateKeyPath: string;
  requestListener?: RequestListener | undefined;
}

/**
 * "Builds" a Node HTTP server, either via `node:http` or `node:https`, depending
 * if we're currently in development mode. If we are, then use a self-signed
 * certificate and private key, otherwise just fall back on an HTTP server.
 *
 * In the production environment, Cloudflare will issue the SSL certificate outside
 * of the server's context anyway.
 */
export const getLocalServer = async ({
  certificatePath,
  nodeEnvironment,
  privateKeyPath,
  requestListener
}: GetNodeServerOptions): Promise<HttpServer | HttpsServer> => {
  try {
    if (nodeEnvironment === "development") {
      const certificateContents = await fsReadFile(certificatePath);
      const privateKeyContents = await fsReadFile(privateKeyPath);

      return createHttpsServer(
        {
          cert: certificateContents,
          key: privateKeyContents
        },
        requestListener
      );
    }

    return createHttpServer(requestListener);
  } catch (err) {
    return createHttpServer(requestListener);
  }
};
