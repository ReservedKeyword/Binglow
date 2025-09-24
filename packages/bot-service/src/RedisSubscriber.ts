import type { AppLogger } from "@binglow/logger";
import type { GetCommandPayload, RedisClient } from "@binglow/redis";
import type { Client as TwitchClient } from "tmi.js";
import type { BotState } from "./BotState";

interface RedisSubscriberOptions {
  botState: BotState;
  logger?: AppLogger | undefined;
  redisClient: RedisClient;
  twitchClient: TwitchClient;
}

export class RedisSubscriber {
  private readonly botState: BotState;
  private readonly logger?: AppLogger | undefined;
  private readonly redisClient: RedisClient;
  private readonly twitchClient: TwitchClient;

  constructor({ botState, logger, redisClient, twitchClient }: RedisSubscriberOptions) {
    this.botState = botState;
    this.logger = logger?.getSubLogger({ name: "Redis Subscriber" });
    this.redisClient = redisClient;
    this.twitchClient = twitchClient;
  }

  private async handleAnnounceBingoCommand({
    gameId,
    twitchUsername
  }: GetCommandPayload<"BOT_CHANNEL", "ANNOUNCE_BINGO">): Promise<void> {
    const foundChannel = this.botState.findChannelByGameId(gameId);

    if (!foundChannel) {
      this.logger?.warn(`Failed to announce bingo: Twitch channel not found by game ID ${gameId}`);
      return;
    }

    this.logger?.info(`Announcing that ${twitchUsername} just got a BINGO in ${foundChannel}'s Twitch chat...`);
    await this.twitchClient.say(foundChannel, `@${twitchUsername} just got a BINGO!`);
  }

  private handleGameEndedCommand({ gameId }: GetCommandPayload<"BOT_CHANNEL", "GAME_ENDED">): void {
    const foundChannel = this.botState.findChannelByGameId(gameId);

    if (!foundChannel) {
      this.logger?.warn(`Failed to update game ending: Twitch channel not found by game ID ${gameId}`);
      return;
    }

    this.logger?.info(`Removing active state for game ID ${gameId}, game has ended...`);
    this.botState.removeActiveGame(gameId);
  }

  private async handleJoinTwitchChannelCommand({
    twitchUsername
  }: GetCommandPayload<"BOT_CHANNEL", "JOIN_TWITCH_CHANNEL">): Promise<void> {
    if (!this.twitchClient.getChannels().includes(`#${twitchUsername}`)) {
      this.logger?.info(`Joining new Twitch chat to listen for commands...`);
      await this.twitchClient.join(twitchUsername);
    }
  }

  initializeSubscriptions(): void {
    this.logger?.info("Initializing Redis client subscribers...");
    this.redisClient.subscribeCommand("BOT_CHANNEL", "ANNOUNCE_BINGO", this.handleAnnounceBingoCommand.bind(this));
    this.redisClient.subscribeCommand("BOT_CHANNEL", "GAME_ENDED", this.handleGameEndedCommand.bind(this));
    this.redisClient.subscribeCommand(
      "BOT_CHANNEL",
      "JOIN_TWITCH_CHANNEL",
      this.handleJoinTwitchChannelCommand.bind(this)
    );
  }
}
