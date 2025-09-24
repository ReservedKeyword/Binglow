import { tileConfigSchema } from "@binglow/game-service/schemas/game";
import { z } from "zod";
import { redisClient } from "../integrations/redis-client";
import { authedUserProcedure, botProcedure, createRpcRouter } from "../trpc";

export const boardTemplateRouter = createRpcRouter({
  create: authedUserProcedure
    .input(
      z.object({
        announceInChat: z.boolean(),
        heatmapThreshold: z.number().min(10).max(100),
        slug: z
          .string()
          .min(3)
          .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
        title: z.string().optional().default("Bingo"),
        tiles: z.array(tileConfigSchema).min(24)
      })
    )
    .mutation(
      async ({
        ctx: {
          db,
          session: { user }
        },
        input: { announceInChat, heatmapThreshold, title, slug, tiles }
      }) => {
        const foundBoardTemplate = await db.boardTemplate.findUnique({
          where: {
            authorId: user.id,
            slug
          }
        });

        if (foundBoardTemplate) {
          throw new Error("You have already chosen this slug. Try another one.");
        }

        const createdBoardTemplate = await db.boardTemplate.create({
          data: {
            announceInChat,
            authorId: user.id,
            heatmapThreshold,
            slug,
            title,
            tiles
          },
          include: {
            author: {
              select: {
                name: true
              }
            }
          }
        });

        await redisClient.publishCommand({
          channel: "BOT_CHANNEL",
          command: {
            command: "JOIN_TWITCH_CHANNEL",
            payload: { twitchUsername: createdBoardTemplate.author.name }
          }
        });

        return createdBoardTemplate;
      }
    ),

  getAllUniqueChannels: botProcedure.query(async ({ ctx: { db } }) => {
    const usersWithBoards = await db.user.findMany({
      select: { name: true },
      where: { boardTemplates: { some: {} } }
    });

    return usersWithBoards.map((user) => user.name);
  }),

  getMyTemplates: authedUserProcedure.query(
    async ({
      ctx: {
        db,
        session: {
          user: { id: userId }
        }
      }
    }) =>
      await db.boardTemplate.findMany({
        orderBy: { updatedAt: "desc" },
        where: { authorId: userId }
      })
  )
});
