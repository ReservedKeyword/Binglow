import type { EndGameCommand, ResetGameCommand, StartGameCommand } from "@binglow/redis";
import type WebSocket from "ws";
import type { RawData } from "ws";
import { z, ZodError } from "zod";
import { Game } from "./Game";
import { serviceLogger } from "./integrations/logger";
import { redisClient } from "./integrations/redis-client";
import { type GameId } from "./schemas/game";
import {
  webSocketMessageSchema,
  type AuthMessage,
  type PingMessage,
  type PongMessage,
  type ServerErrorMessage,
  type WebSocketMessage
} from "./schemas/websocket";
import { getGameConfig, setGameConfig } from "./services/game-state";

export interface AuthenticatedWebSocket extends WebSocket {
  gameId: GameId;
  isAlive: boolean;
  sendMessage: <T = unknown>(message: T) => void | Promise<void>;
  userId: string;
  username: string;
}

/**
 * Amount of time, in milliseconds, that we check if a connection is alive.
 */
const HEARTBEAT_INTERVAL_MS = 30000;

const logger = serviceLogger.getSubLogger({ name: "Game Manager" });

export class GameManager {
  private readonly ongoingGames: Map<GameId, Game>;

  constructor() {
    this.ongoingGames = new Map();
    redisClient.subscribeCommand("GAME_CHANNEL", "END_GAME", this.handleRedisEndGameCommand.bind(this));
    redisClient.subscribeCommand("GAME_CHANNEL", "RESET_GAME", this.handleRedisResetGameCommand.bind(this));
    redisClient.subscribeCommand("GAME_CHANNEL", "START_GAME", this.handleRedisStartGameCommand.bind(this));
  }

  private async endGame(gameId: GameId): Promise<void> {
    const ongoingGame = this.ongoingGames.get(gameId);

    if (ongoingGame) await ongoingGame.end();
    else logger.warn(`No ongoing game found for ${gameId}, cannot end.`);

    this.ongoingGames.delete(gameId);
    logger.info(`Game session ${gameId} has ended and been cleaned up.`);
  }

  private async findOrCreateGame(gameId: GameId): Promise<Game | null> {
    let ongoingGame = this.ongoingGames.get(gameId);

    if (ongoingGame) {
      logger.info(`Found existing game for ${gameId}, returning it...`);
      return ongoingGame;
    }

    // We didn't find a game, create a new one with config
    const gameConfig = await getGameConfig(gameId);

    if (gameConfig) {
      logger.info(`Creating a new game instance for ID ${gameId}...`);
      const newGame = new Game({ gameConfig, gameId });
      this.ongoingGames.set(gameId, newGame);
      return newGame;
    }

    logger.warn(`Failed to create or find game for ID ${gameId}, game config was not found in Redis.`);
    return null;
  }

  private formatZodError(zodError: ZodError): string {
    const flattenedErrors = z.flattenError(zodError);
    const { fieldErrors, formErrors } = flattenedErrors;
    const flattenedFieldErrors = Object.values(fieldErrors).flat() as string[];

    if (flattenedFieldErrors[0]) {
      return flattenedFieldErrors[0];
    }

    if (formErrors[0]) {
      return formErrors[0];
    }

    logger.error("Uncaught Zod validation error: ", zodError);
    return "An unknown validation error has occurred.";
  }

  public async handleConnection(webSocket: WebSocket): Promise<void> {
    const authedSocket = webSocket as AuthenticatedWebSocket;
    authedSocket.isAlive = true;
    const heartbeatInterval = this.startHeartbeatInterval(authedSocket);

    webSocket.on("close", async () => await this.handleConnectionClosed(authedSocket, heartbeatInterval));
    webSocket.on("message", async (data) => await this.handleIncomingMessage(authedSocket, data));
  }

  private async handleConnectionClosed(
    authedSocket: AuthenticatedWebSocket,
    heartbeatInterval: NodeJS.Timeout
  ): Promise<void> {
    clearInterval(heartbeatInterval);
    if (!authedSocket.gameId) return;

    const foundGame = this.ongoingGames.get(authedSocket.gameId);
    if (!foundGame) return;

    await foundGame.startDisconnectionTime(authedSocket.userId, async () => {
      if (foundGame.isEmpty()) {
        await this.endGame(authedSocket.gameId);
      }
    });
  }

  private async handleIncomingMessage(authedSocket: AuthenticatedWebSocket, data: RawData): Promise<void> {
    try {
      const incomingMessage = webSocketMessageSchema.parse(JSON.parse(data.toString()));

      if (incomingMessage.type === "AUTH") await this.handleIncomingAuthMessage(authedSocket, incomingMessage);
      else if (incomingMessage.type === "PING") this.handleIncomingPingMessage(authedSocket);
      else if (incomingMessage.type === "PONG") this.handleIncomingPongMessage(authedSocket);
      else this.handleIncomingGameMessage(authedSocket, incomingMessage);
    } catch (err) {
      const unknownErrorMessage = "An unknown error occurred.";

      const errorMessage =
        err instanceof ZodError ? this.formatZodError(err)
        : err instanceof Error ? err.message
        : unknownErrorMessage;

      if (errorMessage === unknownErrorMessage) {
        logger.error("An unknown error was thrown processing an incoming message: ", err);
      }

      // Intentionally not using authedSocket.sendMessage here, since we cannot
      // guarantee that we're currently authenticated.
      authedSocket.send(
        JSON.stringify({
          type: "SERVER_ERROR",
          payload: { message: errorMessage }
        } as ServerErrorMessage)
      );
    }
  }

  private async handleIncomingAuthMessage(
    authedSocket: AuthenticatedWebSocket,
    incomingMessage: AuthMessage
  ): Promise<void> {
    // TODO: Validate this user is in our database?

    const { gameId, userId, username } = incomingMessage.payload;
    authedSocket.gameId = gameId;
    authedSocket.sendMessage = (message) => authedSocket.send(JSON.stringify(message));
    authedSocket.userId = userId;
    authedSocket.username = username;

    const game = await this.findOrCreateGame(gameId);

    if (!game) {
      throw new Error("Game not found or not started by moderator.");
    }

    await game.addPlayer(authedSocket);
  }

  private handleIncomingGameMessage(authedSocket: AuthenticatedWebSocket, incomingMessage: WebSocketMessage): void {
    if (!authedSocket.gameId) {
      throw new Error("Failed to authenticate connection.");
    }

    const game = this.ongoingGames.get(authedSocket.gameId);
    game?.handleIncomingMessage(incomingMessage, authedSocket);
  }

  private handleIncomingPingMessage(authedSocket: AuthenticatedWebSocket): void {
    logger.info(`Sending PING to ${authedSocket.username} (${authedSocket.userId}).`);
    authedSocket.sendMessage<PongMessage>({ type: "PONG" });
  }

  private handleIncomingPongMessage(authedSocket: AuthenticatedWebSocket): void {
    authedSocket.isAlive = true;
    logger.info(`PONG received from ${authedSocket.username} (${authedSocket.userId}).`);
  }

  private async handleRedisEndGameCommand({ gameId }: EndGameCommand["payload"]): Promise<void> {
    logger.info(`Got Redis command to end game ${gameId}...`);
    await this.endGame(gameId);
  }

  private async handleRedisResetGameCommand({ gameId }: ResetGameCommand["payload"]): Promise<void> {
    logger.info(`Got Redis command to reset game ${gameId}...`);
    const ongoingGame = this.ongoingGames.get(gameId);

    if (ongoingGame) {
      await ongoingGame.reset();
    }
  }

  private async handleRedisStartGameCommand({ gameConfig, gameId }: StartGameCommand["payload"]): Promise<void> {
    logger.info(`Got Redis command to start new game with ID ${gameId}...`);
    await setGameConfig(gameId, gameConfig);
  }

  private startHeartbeatInterval(authedSocket: AuthenticatedWebSocket): NodeJS.Timeout {
    return setInterval(() => {
      if (!authedSocket.isAlive) {
        logger.info(`Connection with ${authedSocket.username} (${authedSocket.userId}) pronounced dead.`);
        return authedSocket.terminate();
      }

      authedSocket.isAlive = false;
      authedSocket.sendMessage<PingMessage>({ type: "PING" });
    }, HEARTBEAT_INTERVAL_MS);
  }
}
