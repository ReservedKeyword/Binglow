"use client";

import type { ClientGameState } from "@binglow/game-service";
import { BoardTileSquare } from "@binglow/web-service/components/BoardTileSquare";

interface BingoBoardProps {
  gameState: ClientGameState;
  onSelectSquare: (squareText: string) => void;
}

export const BingoBoard = ({ gameState, onSelectSquare }: BingoBoardProps) => (
  <div className="grid grid-cols-5 gap-2 w-full max-w-2xl mx-auto p-4 bg-gray-800 rounded-xl shadow-inner">
    {gameState.board.map((row, rowIndex) =>
      row.map((square, colIndex) => (
        <BoardTileSquare
          data={square}
          heatmapPercentage={gameState.heatmap[`${rowIndex}-${colIndex}`] || 0}
          key={`${rowIndex}-${colIndex}`}
          onSelect={() => onSelectSquare(square.text)}
        />
      ))
    )}
  </div>
);
