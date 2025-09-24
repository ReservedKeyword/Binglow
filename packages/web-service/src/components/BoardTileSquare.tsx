"use client";

import type { BingoSquareData } from "@binglow/game-service";

interface BoardTileSquare {
  data: BingoSquareData;
  heatmapPercentage: number;
  onSelect: () => void;
}

export const BoardTileSquare = ({ data, heatmapPercentage, onSelect }: BoardTileSquare) => (
  <div
    className={`relative flex items-center justify-center text-center p-2 aspect-square border border-gray-600 rounded-lg cursor-pointer transition-all duration-300 ${data.selected ? "is-selected-by-user" : "bg-gray-700 hover:bg-gray-600"}`}
    onClick={onSelect}
  >
    <div
      className="absolute inset-0 rounded-lg transition-all duration-500"
      style={{ backgroundColor: `rgba(168, 85, 247, ${heatmapPercentage / 100})` }}
    />

    <span className="relative z-10 text-xs sm:text-sm font-semibold text-white">{data.text}</span>

    <div className="absolute bottom-1 right-1 text-white text-opacity-80 text-[10px] font-mono z-10">
      {heatmapPercentage.toFixed(0)}%
    </div>

    <div className="x-overlay" />
  </div>
);
