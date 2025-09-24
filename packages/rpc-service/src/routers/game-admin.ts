import { gameConfigSchema, gameIdSchema, type GameId } from "@binglow/game-service/schemas/game";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prismaClient } from "../integrations/prisma-client";
import { redisClient } from "../integrations/redis-client";
import { authedUserProcedure, botProcedure, createRpcRouter } from "../trpc";

export const gameAdminRouter = createRpcRouter({
  startGameFromBot: botProcedure
    .input(z.object({ slug: z.string(), twitchChannel: z.string() }))
    .mutation<{ gameId: GameId }>(async ({ input: { slug, twitchChannel } }) => {
      const boardTemplate = await prismaClient.boardTemplate.findUnique({
        where: {
          author: {
            name: {
              equals: twitchChannel,
              mode: "insensitive"
            }
          },
          slug
        }
      });

      if (!boardTemplate) {
        throw new TRPCError({ code: "NOT_FOUND", message: `Failed to find board template ${slug}.` });
      }

      const { announceInChat, heatmapThreshold, tiles, title } = boardTemplate;
      const gameConfig = gameConfigSchema.parse({ announceInChat, heatmapThreshold, tiles, title });
      const gameId = gameIdSchema.parse(randomUUID());

      await redisClient.publishCommand({
        channel: "GAME_CHANNEL",
        command: {
          command: "START_GAME",
          payload: {
            gameConfig,
            gameId
          }
        }
      });

      return { gameId };
    }),

  startGameFromWeb: authedUserProcedure.input(z.object({ slug: z.string() })).mutation<{ gameId: GameId }>(
    async ({
      ctx: {
        session: {
          user: { id: userId }
        }
      },
      input: { slug }
    }) => {
      const boardTemplate = await prismaClient.boardTemplate.findUnique({
        where: {
          authorId: userId,
          slug
        }
      });

      if (!boardTemplate) {
        throw new TRPCError({ code: "NOT_FOUND", message: `Failed to find board template ${slug}.` });
      }

      const { announceInChat, heatmapThreshold, tiles, title } = boardTemplate;
      const gameConfig = gameConfigSchema.parse({ announceInChat, heatmapThreshold, tiles, title });
      const gameId = gameIdSchema.parse(randomUUID());

      await redisClient.publishCommand({
        channel: "GAME_CHANNEL",
        command: {
          command: "START_GAME",
          payload: {
            gameConfig,
            gameId
          }
        }
      });

      return { gameId };
    }
  ),

  resetGame: botProcedure.input(z.object({ gameId: gameIdSchema })).mutation(async ({ input: { gameId } }) => {
    await redisClient.publishCommand({
      channel: "GAME_CHANNEL",
      command: {
        command: "RESET_GAME",
        payload: { gameId }
      }
    });
  }),

  endGame: botProcedure.input(z.object({ gameId: gameIdSchema })).mutation(async ({ input: { gameId } }) => {
    await redisClient.publishCommand({
      channel: "GAME_CHANNEL",
      command: {
        command: "END_GAME",
        payload: { gameId }
      }
    });
  })
});
