import { gameIdSchema } from "@binglow/game-service/schemas/game";
import { z } from "zod";

export const announceBingoCommandSchema = z.object({
  command: z.literal("ANNOUNCE_BINGO"),
  payload: z.object({
    gameId: gameIdSchema,
    twitchUsername: z.string()
  })
});

export const gameEndedCommandSchema = z.object({
  command: z.literal("GAME_ENDED"),
  payload: z.object({
    gameId: gameIdSchema
  })
});

export const joinTwitchChannelCommandSchema = z.object({
  command: z.literal("JOIN_TWITCH_CHANNEL"),
  payload: z.object({
    twitchUsername: z.string()
  })
});

export const botChannelSchema = z.object({
  channel: z.literal("BOT_CHANNEL"),
  command: z.discriminatedUnion("command", [
    announceBingoCommandSchema,
    gameEndedCommandSchema,
    joinTwitchChannelCommandSchema
  ])
});

export type AnnounceBingoCommand = z.infer<typeof announceBingoCommandSchema>;

export type BotChannel = z.infer<typeof botChannelSchema>;

export type GameEndedCommand = z.infer<typeof gameEndedCommandSchema>;

export type JoinTwitchChannelCommand = z.infer<typeof joinTwitchChannelCommandSchema>;
