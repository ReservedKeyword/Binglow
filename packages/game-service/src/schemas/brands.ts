import { z } from "zod";

export const gameIdSchema = z.uuid().brand("GameId");

export type GameId = z.infer<typeof gameIdSchema>;
