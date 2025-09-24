import { z } from "zod";
import { clientGameStateSchema, gameIdSchema } from "./game";

export const activityEventMessageSchema = z.object({
  type: z.literal("ACTIVITY_EVENT"),
  payload: z.object({
    eventType: z.enum(["bingo", "join", "leave", "reconnected"]),
    username: z.string(),
    timestamp: z.iso.datetime()
  })
});

export const authMessageSchema = z.object({
  type: z.literal("AUTH"),
  payload: z.object({
    gameId: gameIdSchema,
    userId: z.cuid(),
    username: z.string()
  })
});

export const bingoCooldownMessageSchema = z.object({
  type: z.literal("BINGO_COOLDOWN"),
  payload: z.object({
    cooldownSeconds: z.number()
  })
});

export const claimBingoMessageSchema = z.object({
  type: z.literal("CLAIM_BINGO")
});

export const gameEndedMessageSchema = z.object({
  type: z.literal("GAME_ENDED")
});

export const gameStateMessageSchema = z.object({
  type: z.literal("GAME_STATE"),
  payload: clientGameStateSchema
});

export const pingMessageSchema = z.object({
  type: z.literal("PING")
});

export const pongMessageSchema = z.object({
  type: z.literal("PONG")
});

export const selectSquareMessageSchema = z.object({
  type: z.literal("SELECT_SQUARE"),
  payload: z.object({
    squareText: z.string()
  })
});

export const serverErrorMessage = z.object({
  type: z.literal("SERVER_ERROR"),
  payload: z.object({
    message: z.string()
  })
});

export const webSocketMessageSchema = z.discriminatedUnion("type", [
  activityEventMessageSchema,
  authMessageSchema,
  bingoCooldownMessageSchema,
  claimBingoMessageSchema,
  gameEndedMessageSchema,
  gameStateMessageSchema,
  pingMessageSchema,
  pongMessageSchema,
  selectSquareMessageSchema,
  serverErrorMessage
]);

export type ActivityEventMessage = z.infer<typeof activityEventMessageSchema>;

export type AuthMessage = z.infer<typeof authMessageSchema>;

export type BingoCooldownMessage = z.infer<typeof bingoCooldownMessageSchema>;

export type ClaimBingoMessage = z.infer<typeof claimBingoMessageSchema>;

export type GameEndedMessage = z.infer<typeof gameEndedMessageSchema>;

export type GameStateMessage = z.infer<typeof gameStateMessageSchema>;

export type PingMessage = z.infer<typeof pingMessageSchema>;

export type PongMessage = z.infer<typeof pongMessageSchema>;

export type SelectSquareMessage = z.infer<typeof selectSquareMessageSchema>;

export type ServerErrorMessage = z.infer<typeof serverErrorMessage>;

export type WebSocketMessage = z.infer<typeof webSocketMessageSchema>;
