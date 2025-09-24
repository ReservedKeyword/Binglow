import { createRpcRouter } from "../trpc";
import { boardTemplateRouter } from "./board-template";
import { gameAdminRouter } from "./game-admin";

export const appRouter = createRpcRouter({
  boardTemplate: boardTemplateRouter,
  gameAdmin: gameAdminRouter
});

export type AppRouter = typeof appRouter;
