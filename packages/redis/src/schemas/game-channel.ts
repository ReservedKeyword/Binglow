import { gameConfigSchema, gameIdSchema } from "@binglow/game-service/schemas/game";
import { z } from "zod";

export const endGameCommandSchema = z.object({
  command: z.literal("END_GAME"),
  payload: z.object({
    gameId: gameIdSchema
  })
});

export const resetGameCommandSchema = z.object({
  command: z.literal("RESET_GAME"),
  payload: z.object({
    gameId: gameIdSchema
  })
});

export const startGameCommandSchema = z.object({
  command: z.literal("START_GAME"),
  payload: z.object({
    gameId: gameIdSchema,
    gameConfig: gameConfigSchema
  })
});

export const gameChannelSchema = z.object({
  channel: z.literal("GAME_CHANNEL"),
  command: z.discriminatedUnion("command", [endGameCommandSchema, resetGameCommandSchema, startGameCommandSchema])
});

export type EndGameCommand = z.infer<typeof endGameCommandSchema>;

export type GameChannel = z.infer<typeof gameChannelSchema>;

export type ResetGameCommand = z.infer<typeof resetGameCommandSchema>;

export type StartGameCommand = z.infer<typeof startGameCommandSchema>;
