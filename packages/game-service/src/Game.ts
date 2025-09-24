import type { AuthenticatedWebSocket } from "./GameManager";
import { serviceLogger } from "./integrations/logger";
import { redisClient } from "./integrations/redis-client";
import type { GameConfig, GameId, GameState, User } from "./schemas/game";
import type { BingoCooldownMessage, WebSocketMessage } from "./schemas/websocket";
import {
  calculateHeatmap,
  calculateStateForNewRound,
  calculateStateWithNewPlayer,
  calculateStateWithoutPlayer,
  calculateStateWithSelection,
  checkBingo
} from "./services/game-logic";
import { clearGame, generateClientGameState, getGameState, setGameState } from "./services/game-state";

export interface GameOptions {
  gameId: GameId;
  gameConfig: GameConfig;
}

/**
 * Amount of time, in seconds, that we prevent the user from clicking
 * the "BINGO!" button the web portal again, to prevent spamming.
 *
 * Default is 60 seconds, but this may need to be increased in the future.
 */
const BINGO_COOLDOWN_SECONDS = 60;

/**
 * When a player disconnects, this is the amount of time we'll wait for
 * a reconnection before cleaning up their player state.
 */
const DISCONNECTION_WAIT_PERIOD_SECONDS = 30;

const logger = serviceLogger.getSubLogger({ name: "Game" });

export class Game {
  private readonly gameConfig: GameConfig;
  private readonly gameId: GameId;

  private readonly disconnectionTimers: Map<string, NodeJS.Timeout>;
  private readonly players: Map<string, AuthenticatedWebSocket>;

  constructor({ gameId, gameConfig }: GameOptions) {
    this.gameConfig = gameConfig;
    this.gameId = gameId;

    this.disconnectionTimers = new Map();
    this.players = new Map();
  }

  async addPlayer(authedWebSocket: AuthenticatedWebSocket): Promise<void> {
    const { tiles: configTiles } = this.gameConfig;
    const gameState = await getGameState(this.gameId);
    const existingPlayer = gameState.players[authedWebSocket.userId];
    const isReconnecting = () => existingPlayer && existingPlayer.status === "disconnected";

    if (isReconnecting()) {
      logger.info(`${authedWebSocket.username} (${authedWebSocket.userId}) is reconnecting to game ${this.gameId}`);
      this.clearDisconnectionTimer(authedWebSocket.userId);
    } else {
      logger.info(`${authedWebSocket.username} (${authedWebSocket.userId}) is joining game ${this.gameId}`);
    }

    const connectedUser: User = { id: authedWebSocket.userId, name: authedWebSocket.username };
    const newGameState = calculateStateWithNewPlayer(gameState, connectedUser, configTiles);
    await setGameState(this.gameId, newGameState);
    this.players.set(authedWebSocket.userId, authedWebSocket);

    this.broadcast({
      type: "ACTIVITY_EVENT",
      payload: {
        eventType: isReconnecting() ? "reconnected" : "join",
        username: authedWebSocket.username,
        timestamp: new Date().toISOString()
      }
    });

    this.broadcastClientGameState();
  }

  private broadcast(
    builderOrMessage:
      | WebSocketMessage
      | ((webSocket: AuthenticatedWebSocket) => WebSocketMessage | Promise<WebSocketMessage>)
  ): void {
    Array.from(this.players.values()).forEach(async (webSocket) => {
      if (webSocket.readyState === WebSocket.OPEN) {
        try {
          const messageToSend =
            typeof builderOrMessage === "function" ? await builderOrMessage(webSocket) : builderOrMessage;

          webSocket.send(JSON.stringify(messageToSend));
        } catch (err) {
          logger.error(`Failed to broadcast message to ${webSocket.username} (${webSocket.userId})`, err);
        }
      }
    });
  }

  private broadcastClientGameState(): void {
    this.broadcast(async (webSocket) => {
      const { heatmapThreshold, title } = this.gameConfig;
      const clientState = await generateClientGameState(this.gameId, heatmapThreshold, title, webSocket.userId);

      if (!clientState) {
        throw new Error("generateClientGameState returned an undefined value.");
      }

      return {
        type: "GAME_STATE",
        payload: clientState
      };
    });
  }

  private clearDisconnectionTimer(userId: string) {
    const disconnectionTimer = this.disconnectionTimers.get(userId);

    if (disconnectionTimer) {
      clearTimeout(disconnectionTimer);
      this.disconnectionTimers.delete(userId);
    }
  }

  async end(): Promise<void> {
    this.broadcast({ type: "GAME_ENDED" });

    await clearGame(this.gameId);

    await redisClient.publishCommand({
      channel: "BOT_CHANNEL",
      command: {
        command: "GAME_ENDED",
        payload: { gameId: this.gameId }
      }
    });
  }

  async handleIncomingMessage(
    incomingMessage: WebSocketMessage,
    authedWebSocket: AuthenticatedWebSocket
  ): Promise<void> {
    const currentState = await getGameState(this.gameId);

    if (incomingMessage.type === "CLAIM_BINGO")
      await this.handleIncomingClaimBingoMessage(authedWebSocket, currentState);
    else if (incomingMessage.type === "SELECT_SQUARE")
      await this.handleIncomingSelectSquareMessage(authedWebSocket, currentState, incomingMessage.payload.squareText);
  }

  private async handleIncomingClaimBingoMessage(
    authedWebSocket: AuthenticatedWebSocket,
    gameState: GameState
  ): Promise<void> {
    const { userId } = authedWebSocket;
    const currentPlayer = gameState.players[userId];

    if (!currentPlayer) return;

    const { announceInChat, heatmapThreshold } = this.gameConfig;
    const heatmap = calculateHeatmap(gameState);

    if (!checkBingo(currentPlayer, heatmap, heatmapThreshold)) return;

    this.broadcast({
      type: "ACTIVITY_EVENT",
      payload: {
        eventType: "bingo",
        username: currentPlayer.name,
        timestamp: new Date().toISOString()
      }
    });

    if (announceInChat) {
      await redisClient.publishCommand({
        channel: "BOT_CHANNEL",
        command: {
          command: "ANNOUNCE_BINGO",
          payload: {
            gameId: this.gameId,
            twitchUsername: currentPlayer.name
          }
        }
      });
    }

    // Trigger a cooldown to prevent spamming
    authedWebSocket.sendMessage<BingoCooldownMessage>({
      type: "BINGO_COOLDOWN",
      payload: { cooldownSeconds: BINGO_COOLDOWN_SECONDS }
    });
  }

  private async handleIncomingSelectSquareMessage(
    authedWebSocket: AuthenticatedWebSocket,
    gameState: GameState,
    squareText: string
  ): Promise<void> {
    const { userId } = authedWebSocket;
    const newState = calculateStateWithSelection(gameState, userId, squareText);
    await setGameState(this.gameId, newState);
    this.broadcastClientGameState();
  }

  isEmpty(): boolean {
    return this.players.size === 0;
  }

  async startDisconnectionTime(playerId: string, callbackDisconnected: () => void | Promise<void>): Promise<void> {
    logger.info(`Starting ${DISCONNECTION_WAIT_PERIOD_SECONDS}s disconnection timer for player ${playerId}...`);

    this.disconnectionTimers.set(
      playerId,
      setTimeout(async () => {
        logger.info(`Player ${playerId} did not reconnect in time. Removing from game...`);
        this.removePlayer(playerId);
        this.disconnectionTimers.delete(playerId);
        await callbackDisconnected();
      }, DISCONNECTION_WAIT_PERIOD_SECONDS * 1000)
    );

    const gameState = await getGameState(this.gameId);
    const playerState = gameState.players[playerId];

    if (playerState) {
      await setGameState(this.gameId, {
        ...gameState,
        players: {
          ...gameState.players,
          [playerId]: {
            ...playerState,
            status: "disconnected"
          }
        }
      });
    }
  }

  async removePlayer(playerId: string): Promise<void> {
    const playerToRemove = this.players.get(playerId);

    if (!playerToRemove) {
      return;
    }

    const username = playerToRemove.username;
    this.players.delete(playerId);
    logger.info(`${username} (${playerId}) has been removed from game ${this.gameId}`);

    const currentState = await getGameState(this.gameId);
    const newState = calculateStateWithoutPlayer(currentState, playerId);
    await setGameState(this.gameId, newState);

    this.broadcast({
      type: "ACTIVITY_EVENT",
      payload: {
        eventType: "leave",
        username,
        timestamp: new Date().toISOString()
      }
    });

    this.broadcastClientGameState();
  }

  async reset(): Promise<void> {
    const { tiles: configTiles } = this.gameConfig;
    const currentState = await getGameState(this.gameId);
    const newState = calculateStateForNewRound(currentState, configTiles);
    await setGameState(this.gameId, newState);
    this.broadcastClientGameState();
  }
}
