"use client";

import { type AppRouter } from "@binglow/rpc-service/routers";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState, type ReactNode } from "react";
import superjson from "superjson";
import { webServiceEnvironment } from "../environment";

export const rpcClient = createTRPCReact<AppRouter>();

export function TRPCReactProvider(props: { children: ReactNode }) {
  const queryClient = new QueryClient();

  const [trpcClient] = useState(() =>
    rpcClient.createClient({
      links: [
        httpBatchLink({
          // @ts-ignore: TypeScript doesn't like this, but I also don't care. It works (for now at least).
          fetch: (url, options) => fetch(url, { ...options, credentials: "include" }),
          transformer: superjson,
          url: `${webServiceEnvironment.NEXT_PUBLIC_RPC_URL}/trpc`
        }),
        loggerLink({
          enabled: (options) =>
            webServiceEnvironment.NODE_ENV === "development" ||
            (options.direction === "down" && options.result instanceof Error)
        })
      ]
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <rpcClient.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </rpcClient.Provider>
    </QueryClientProvider>
  );
}
