import { z } from "zod";
import { botChannelSchema } from "./bot-channel";
import { gameChannelSchema } from "./game-channel";

export const channelSchemas = z.discriminatedUnion("channel", [botChannelSchema, gameChannelSchema]);

export type * from "./bot-channel";
export type * from "./game-channel";
export type PubSub = z.infer<typeof channelSchemas>;
