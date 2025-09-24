import type { AppLogger } from "@binglow/logger";
import type { OAuthOptions } from "@binglow/oauth/OAuth";
import { TwitchOAuthClient } from "@binglow/oauth/TwitchOAuthClient";
import { TRPCClientError } from "@trpc/client";
import { Client, type ChatUserstate as ChatUserState } from "tmi.js";
import type { BotState } from "./BotState";
import { serviceEnvironment } from "./integrations/environment";
import { rpcClient } from "./integrations/rpc-client";

export interface TwitchClientOptions {
  appUrl: string;
  authOptions: OAuthOptions;
  botState: BotState;
  logger?: AppLogger | undefined;
}

export class TwitchClient {
  private readonly appUrl: string;
  private readonly botState: BotState;
  private readonly logger?: AppLogger | undefined;
  protected twitchClient?: Client | undefined;
  private readonly twitchOAuthClient: TwitchOAuthClient;

  constructor({ appUrl, authOptions, botState, logger }: TwitchClientOptions) {
    this.appUrl = appUrl;
    this.botState = botState;
    this.logger = logger?.getSubLogger({ name: "Twitch Client" });
    this.twitchOAuthClient = new TwitchOAuthClient(authOptions);
  }

  getUnderlyingClient(): Client | undefined {
    return this.twitchClient;
  }

  private async handleMessage(
    channel: string,
    userState: ChatUserState,
    message: string,
    self: boolean
  ): Promise<void> {
    if (self) return;
    if (!userState.mod && userState["room-id"] !== userState["user-id"]) return;

    const cleanChannel = channel.replace("#", "");
    const args = message.trim().split(/\s+/);
    const command = args.shift()?.toLowerCase();

    if (command !== "!binglow") return;

    const action = args.shift()?.toLowerCase();

    if (action === "start") return await this.handleStartCommand(cleanChannel, args[0]);
    else if (action === "reset") return await this.handleResetCommand(cleanChannel);
    else if (action === "end") return await this.handleEndCommand(cleanChannel);
  }

  private async handleEndCommand(channel: string): Promise<void> {
    if (!this.isClientDefined()) return;
    const gameId = this.botState.getActiveGame(channel);

    if (!gameId) {
      this.twitchClient.say(channel, "No active bingo game to end.");
      return;
    }

    await rpcClient.gameAdmin.endGame.mutate({ gameId });
    this.twitchClient.say(channel, "Ending the current bingo game...");
  }

  private async handleStartCommand(channel: string, slug?: string): Promise<void> {
    if (!this.isClientDefined()) return;
    const activeGameId = this.botState.getActiveGame(channel);

    if (activeGameId) {
      this.twitchClient.say(channel, `A game is already in session. Join via ${this.appUrl}/bingo/${activeGameId}`);
      return;
    }

    if (!slug) {
      this.twitchClient.say(channel, "Usage: !binglow start <template-slug>");
      return;
    }

    try {
      const { gameId } = await rpcClient.gameAdmin.startGameFromBot.mutate({ slug, twitchChannel: channel });
      this.botState.setActiveGame(channel, gameId);
      this.twitchClient.say(channel, `Bingo game started! Join here: ${this.appUrl}/bingo/${gameId}`);
    } catch (err) {
      if (err instanceof TRPCClientError) {
        this.twitchClient.say(channel, `An error occurred: ${err}`);
        return;
      }

      this.logger?.error(err);
      this.twitchClient.say(channel, "An unknown error occurred. Please try again.");
    }
  }

  private async handleResetCommand(channel: string): Promise<void> {
    if (!this.isClientDefined()) return;
    const gameId = this.botState.getActiveGame(channel);

    if (!gameId) {
      this.twitchClient.say(channel, "No active bingo game to reset.");
      return;
    }

    await rpcClient.gameAdmin.resetGame.mutate({ gameId });
    this.twitchClient.say(channel, "Resetting the current bingo board...");
  }

  private isClientDefined(): this is this & { readonly twitchClient: Client } {
    if (typeof this.twitchClient === "undefined" || !(this.twitchClient instanceof Client)) {
      this.logger?.warn("Checked if Twitch was defined, was undefined.");
      return false;
    }

    return true;
  }

  async initClient(): Promise<void> {
    if (this.twitchClient?.readyState() === "OPEN") {
      return;
    }

    const twitchClient = new Client({
      connection: {
        maxReconnectInterval: 30000,
        reconnect: true,
        reconnectDecay: 1.5,
        reconnectInterval: 2000,
        secure: true
      },
      identity: {
        username: serviceEnvironment.TWITCH_BOT_USERNAME,
        password: async () => {
          const accessToken = await this.twitchOAuthClient.getAccessToken();

          if (!accessToken) {
            this.logger?.error("Failed to get valid access token for reconnection!");
            throw new Error("Missing access token");
          }

          return `oauth:${accessToken}`;
        }
      }
    });

    try {
      await twitchClient.connect();
      twitchClient.on("message", this.handleMessage.bind(this));
      this.twitchClient = twitchClient;
    } catch (err) {
      this.logger?.error("Failed to connect to Twitch IRC.", err);
    }
  }

  async joinInitialChannels(): Promise<void> {
    if (!this.isClientDefined()) return;

    try {
      this.logger?.info("Fetching initial channels from board templates...");
      const channelsToJoin = await rpcClient.boardTemplate.getAllUniqueChannels.query();

      for (const channelToJoin of channelsToJoin) {
        await this.twitchClient.join(channelToJoin);
      }

      this.logger?.info(`Successfully joined ${channelsToJoin.length} initial channel(s).`);
    } catch (err) {
      this.logger?.error("Failed to fetch and join initial bot channels", err);
    }
  }
}
