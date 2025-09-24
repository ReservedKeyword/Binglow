import { redisClient } from "../integrations/redis-client";
import {
  gameConfigSchema,
  gameStateSchema,
  type ClientGameState,
  type GameConfig,
  type GameId,
  type GameState
} from "../schemas/game";
import { calculateHeatmap } from "./game-logic";

const getGameKey = (gameId: GameId) => `binglow:game-state:${gameId}`;

const getGameConfigKey = (gameId: GameId) => `binglow:game-config:${gameId}`;

const redisCommandClient = redisClient.getCommandClient();

export const clearGame = async (gameId: GameId): Promise<void> => {
  await redisCommandClient.del([getGameConfigKey(gameId), getGameKey(gameId)]);
};

export const generateClientGameState = async (
  gameId: GameId,
  heatmapThreshold: number,
  title: string,
  userId: string
): Promise<ClientGameState | undefined> => {
  const currentState = await getGameState(gameId);
  const currentPlayer = currentState.players[userId];

  if (!currentPlayer) {
    return;
  }

  const textBasedHeatmap = calculateHeatmap(currentState);
  const coordinateHeatmap: Record<string, number> = {};

  currentPlayer.board.forEach((row, rowIdx) => {
    row.forEach((square, columnIdx) => {
      coordinateHeatmap[`${rowIdx}-${columnIdx}`] = textBasedHeatmap[square.text] ?? 0;
    });
  });

  const clientBoard = currentPlayer.board.map((row) =>
    row.map((square) => ({ ...square, selected: !!currentPlayer.selections[square.text] }))
  );

  return {
    board: clientBoard,
    heatmap: coordinateHeatmap,
    heatmapThreshold,
    title
  };
};

export const getGameConfig = async (gameId: GameId): Promise<GameConfig | null> => {
  const configJson = await redisCommandClient.get(getGameConfigKey(gameId));
  return configJson ? gameConfigSchema.parse(JSON.parse(configJson)) : null;
};

export const getGameState = async (gameId: GameId): Promise<GameState> => {
  const stateJson = await redisCommandClient.get(getGameKey(gameId));
  return stateJson ? gameStateSchema.parse(JSON.parse(stateJson)) : { players: {} };
};

export const setGameConfig = async (gameId: GameId, gameConfig: GameConfig): Promise<void> => {
  await redisCommandClient.set(getGameConfigKey(gameId), JSON.stringify(gameConfig));
};

export const setGameState = async (gameId: GameId, newState: GameState): Promise<void> => {
  await redisCommandClient.set(getGameKey(gameId), JSON.stringify(newState));
};
