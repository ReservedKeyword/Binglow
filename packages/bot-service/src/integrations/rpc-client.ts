import type { AppRouter } from "@binglow/rpc-service/routers";
import { createTRPCProxyClient, httpBatchStreamLink } from "@trpc/client";
import superjson from "superjson";
import { serviceEnvironment } from "./environment";

export const rpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchStreamLink({
      headers: {
        "X-Bot-Secret": serviceEnvironment.BOT_SECRET
      },
      url: `${serviceEnvironment.RPC_URL}/trpc`,
      transformer: superjson
    })
  ]
});
