"use client";

import type { TileConfig } from "@binglow/game-service";

interface EditableBingoBoardProps {
  tiles: TileConfig[];
  setTiles: (tiles: TileConfig[]) => void;
}

export const EditableBingoBoard = ({ tiles, setTiles }: EditableBingoBoardProps) => {
  const handleTileChange = (index: number, newText: string) => {
    const newTiles = tiles.map((tile, i) => {
      if (i === index) {
        return { ...tile, text: newText };
      }

      return tile;
    });

    setTiles(newTiles);
  };

  const boardSize = 5;
  let tileIndex = 0;

  return (
    <div className="grid grid-cols-5 gap-1.5 w-full max-w-lg mx-auto p-2 bg-gray-900 rounded-lg">
      {Array.from({ length: boardSize * boardSize }).map((_, i) => {
        const isCenter = i === Math.floor((boardSize * boardSize) / 2);

        if (isCenter) {
          return (
            <div
              className="flex items-center justify-center aspect-square bg-green-800 text-white font-bold rounded-md text-sm"
              key={i}
            >
              FREE SPACE
            </div>
          );
        }

        const currentIndex = tileIndex++;
        const currentTile = tiles[currentIndex];

        return (
          <div className="aspect-square" key={i}>
            <textarea
              className="w-full h-full p-1 bg-gray-700 border border-gray-600 rounded-md text-white text-center text-[10px] sm:text-xs focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              onChange={({ target: { value } }) => handleTileChange(currentIndex, value)}
              value={currentTile?.text ?? ""}
            />
          </div>
        );
      })}
    </div>
  );
};
