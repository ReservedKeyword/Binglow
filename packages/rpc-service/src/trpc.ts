import type { User } from "@binglow/game-service/schemas/game";
import type { PrismaClient } from "@binglow/prisma/client";
import { initTRPC, TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { IncomingHttpHeaders } from "http";
import superjson from "superjson";
import z, { ZodError } from "zod";
import { serviceEnvironment } from "./integrations/environment";
import { prismaClient } from "./integrations/prisma-client";

export interface RpcContext {
  db: PrismaClient;
  headers: IncomingHttpHeaders;
  session: {
    user?: User | null;
  };
}

export const createContext = async ({ req }: CreateExpressContextOptions): Promise<RpcContext> => {
  const { cookies, headers } = req;
  const userSession = await getUserFromSessionCookie(cookies);

  return {
    db: prismaClient,
    headers,
    session: {
      user: isUser(userSession) ? userSession : null
    }
  };
};

const getUserFromSessionCookie = async (cookies: Record<string, any>): Promise<User | null> => {
  const sessionToken = cookies["__Secure-next-auth.session-token"] ?? cookies["next-auth.session-token"];
  if (!sessionToken) return null;

  const currentSession = await prismaClient.session.findUnique({
    include: {
      user: {
        select: {
          id: true,
          name: true
        }
      }
    },
    where: {
      expires: { gt: new Date() },
      sessionToken
    }
  });

  return currentSession?.user ?? null;
};

const isUser = (obj: unknown): obj is User =>
  typeof (obj as User)?.id !== "undefined" && typeof (obj as User)?.name !== "undefined";

const rpcRoot = initTRPC.context<RpcContext>().create({
  errorFormatter: ({ error, shape }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError: error.cause instanceof ZodError ? z.treeifyError(error.cause) : undefined
    }
  }),
  transformer: superjson
});

const isAuthedUserMiddleware = rpcRoot.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      session: {
        ...ctx.session,
        user: ctx.session.user
      }
    }
  });
});

const isBotMiddleware = rpcRoot.middleware(({ ctx, next }) => {
  if (ctx.headers["x-bot-secret"] !== serviceEnvironment.BOT_SECRET) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next();
});

export const createRpcRouter = rpcRoot.router;
export const authedUserProcedure = rpcRoot.procedure.use(isAuthedUserMiddleware);
export const botProcedure = rpcRoot.procedure.use(isBotMiddleware);
export const publicProcedure = rpcRoot.procedure;
