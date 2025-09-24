import { serviceLogger } from "../integrations/logger";
import type { BingoSquareData, Board, GameState, Player, TileConfig, User } from "../schemas/game";

const BOARD_SIZE = 5;

const logger = serviceLogger.getSubLogger({ name: "Game Logic" });

const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    const tempI = shuffled[i];
    const tempJ = shuffled[j];

    if (!tempI || !tempJ) {
      throw new Error("Logic error in shuffle algorithm: index out of bounds.");
    }

    shuffled[i] = tempJ;
    shuffled[j] = tempI;
  }

  return shuffled;
};

export const calculateHeatmap = (gameState: GameState): Record<string, number> => {
  const totalPlayers = Object.keys(gameState.players).length;

  if (totalPlayers === 0) {
    return {};
  }

  // Aggregate selections from all players based on square text
  const selectionCounts: Record<string, number> = {};

  Object.values(gameState.players).forEach((player) => {
    Object.keys(player.selections).forEach((squareText) => {
      if (player.selections[squareText]) {
        selectionCounts[squareText] = (selectionCounts[squareText] ?? 0) + 1;
      }
    });
  });

  // Calculate the heatmap, by taking the numbers of selections per square text,
  // dividing it by the total number of players in the game, and multiplying the
  // whole value by 100.
  const heatmap: Record<string, number> = {};

  Object.keys(selectionCounts).forEach((selectionText) => {
    if (!selectionCounts[selectionText]) {
      logger.warn(`Unable to calculate heatmeap for ${selectionText}, not found.`);
      return;
    }

    heatmap[selectionText] = (selectionCounts[selectionText] / totalPlayers) * 100;
  });

  return heatmap;
};

export const calculateStateForNewRound = (gameState: GameState, boardTiles: TileConfig[]): GameState => {
  const updatedPlayers: Record<string, Player> = {};

  for (const playerId in gameState.players) {
    const oldPlayer = gameState.players[playerId];

    if (oldPlayer) {
      updatedPlayers[playerId] = {
        ...oldPlayer,
        board: generateNewBoard(boardTiles),
        selections: {}
      };
    }
  }

  return { players: updatedPlayers };
};

export const calculateStateWithNewPlayer = (gameState: GameState, user: User, boardTiles: TileConfig[]): GameState => {
  if (gameState.players[user.id]) {
    return gameState;
  }

  const newPlayer: Player = {
    id: user.id,
    name: user.name,
    board: generateNewBoard(boardTiles),
    selections: {},
    status: "connected"
  };

  return {
    ...gameState,
    players: {
      ...gameState.players,
      [user.id]: newPlayer
    }
  };
};

export const calculateStateWithSelection = (gameState: GameState, playerId: string, squareText: string): GameState => {
  const player = gameState.players[playerId];

  if (!player) {
    return gameState;
  }

  const newSelections = { ...player.selections, [squareText]: !player.selections[squareText] };
  const updatedPlayer: Player = { ...player, selections: newSelections };

  return {
    ...gameState,
    players: {
      ...gameState.players,
      [playerId]: updatedPlayer
    }
  };
};

export const calculateStateWithoutPlayer = (gameState: GameState, playerId: string): GameState => {
  const { [playerId]: _, ...remainingPlayers } = gameState.players;

  return {
    ...gameState,
    players: remainingPlayers
  };
};

export const checkBingo = (player: Player, heatmap: Record<string, number>, heatmapThreshold: number): boolean => {
  const { board: playerBoard } = player;
  const playerBoardSize = playerBoard.length;

  const isWinningSquare = (square: BingoSquareData | undefined): boolean =>
    square ? !!player.selections[square.text] && (heatmap[square.text] ?? 0) / 100 >= heatmapThreshold / 100 : false;

  const boardIndicies = Array.from({ length: playerBoardSize }, (_, i) => i);

  const hasWinningColumn = boardIndicies.some((columnIdx) =>
    boardIndicies.every((rowIdx) => isWinningSquare(playerBoard[rowIdx]?.[columnIdx]))
  );

  const hasWinningRow = boardIndicies.some((rowIdx) =>
    boardIndicies.every((columnIdx) => isWinningSquare(playerBoard[rowIdx]?.[columnIdx]))
  );

  const hasWinningAntiDiagonal = boardIndicies.every((i) => isWinningSquare(playerBoard[i]?.[playerBoardSize - 1 - i]));

  const hasWinningMainDiagonal = boardIndicies.every((i) => isWinningSquare(playerBoard[i]?.[i]));

  return hasWinningColumn || hasWinningRow || hasWinningAntiDiagonal || hasWinningMainDiagonal;
};

export const generateNewBoard = (boardTiles: TileConfig[]): Board => {
  const shuffledTiles = shuffle(boardTiles);
  const centerIdx = Math.floor((BOARD_SIZE * BOARD_SIZE) / 2);

  const flatBoard = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => {
    if (i === centerIdx) {
      return { text: "FREE SPACE", selected: true };
    }

    const tileIdx = i < centerIdx ? i : i - 1;
    const text = shuffledTiles[tileIdx]?.text ?? "Extra";
    return { text, selected: false };
  });

  return Array.from({ length: BOARD_SIZE }, (_, rowIdx) =>
    flatBoard.slice(rowIdx * BOARD_SIZE, rowIdx * BOARD_SIZE + BOARD_SIZE)
  );
};
