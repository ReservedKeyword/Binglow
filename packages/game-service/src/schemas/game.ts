import { z } from "zod";

export const bingoSquareDataSchema = z.object({
  selected: z.boolean(),
  text: z.string()
});

export const boardSchema = z.array(z.array(bingoSquareDataSchema));

export const playerSchema = z.object({
  board: boardSchema,
  id: z.string(),
  name: z.string(),
  selections: z.record(z.string(), z.boolean()),
  status: z.enum(["disconnected", "connected"]).default("connected")
});

export const tileConfigSchema = z.object({
  text: z.string()
});

export const gameConfigSchema = z.object({
  announceInChat: z.boolean(),
  heatmapThreshold: z.number(),
  title: z.string(),
  tiles: z.array(tileConfigSchema)
});

export const clientGameStateSchema = z.object({
  board: boardSchema,
  heatmapThreshold: z.number(),
  heatmap: z.record(z.string(), z.number()),
  title: z.string()
});

export const gameStateSchema = z.object({
  players: z.record(z.string(), playerSchema)
});

export const gameIdSchema = z.uuid("Invalid game ID. Must be UUID.").brand("GameId");

export type Board = z.infer<typeof boardSchema>;

export type BingoSquareData = z.infer<typeof bingoSquareDataSchema>;

export type ClientGameState = z.infer<typeof clientGameStateSchema>;

export type GameConfig = z.infer<typeof gameConfigSchema>;

export type GameId = z.infer<typeof gameIdSchema>;

export type GameState = z.infer<typeof gameStateSchema>;

export type Player = z.infer<typeof playerSchema>;

export type TileConfig = z.infer<typeof tileConfigSchema>;

export type User = Pick<Player, "id" | "name">;
