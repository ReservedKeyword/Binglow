"use client";

import type { TileConfig } from "@binglow/game-service";
import { Tooltip } from "@binglow/web-service/components/Tooltip";
import Link from "next/link";
import { useState } from "react";
import { EditableBingoBoard } from "./EditableBingoBoard";

export interface CreateBoardFormData {
  announceInChat: boolean;
  heatmapThreshold: number;
  title: string;
  slug: string;
  tiles: TileConfig[];
}

interface CreateBoardFormProps {
  isSaving: boolean;
  onSave: (data: CreateBoardFormData) => void;
}

const DEFAULT_BINGO_SQUARES_ARRAY = Array.from<TileConfig>({ length: 24 }).fill({ text: "" });

export const CreateBoardForm = ({ isSaving, onSave }: CreateBoardFormProps) => {
  const [announceInChat, setAnnounceInChat] = useState(false);
  const [heatmapThreshold, setHeatmapThreshold] = useState(50);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [tiles, setTiles] = useState(DEFAULT_BINGO_SQUARES_ARRAY);

  const handleSave = () =>
    onSave({
      announceInChat,
      heatmapThreshold,
      title,
      slug,
      tiles
    });

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-8">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-bold text-center text-sky-400 mb-2">Create Bingo Board</h1>
        <p className="text-center text-gray-400 mb-8">Design your board and share it with your chat.</p>

        <div className="flex flex-col md:flex-row-reverse gap-8">
          {/* Column (Right): Settings */}
          <div className="w-full md:w-1/3 bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-sky-300 border-b border-gray-700 pb-2 mb-4">Board Details</h2>
              <div className="space-y-4">
                {/* Input: Board Title */}
                <div className="flex items-center mb-1">
                  <label className="block text-sm font-medium text-gray-400" htmlFor="board-title-input">
                    Board Title
                  </label>

                  <Tooltip text="The title that will be displayed on the bingo board page during the game." />
                </div>

                <input
                  className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  id="board-title-input"
                  onChange={({ target: { value } }) => setTitle(value)}
                  placeholder="Bingo"
                  type="text"
                  value={title}
                />

                {/* Input: Unique Slug */}
                <div className="flex items-center mb-1">
                  <label htmlFor="board-slug-input" className="block text-sm font-medium text-gray-400">
                    Unique Slug
                  </label>

                  <Tooltip text="A unique, URL-friendly ID for this board. Used in the '!binglow start' bot command." />
                </div>

                <input
                  className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  id="board-slug-input"
                  onChange={({ target: { value } }) => setSlug(value.toLowerCase().replace(/\s+/g, "-"))}
                  placeholder="my-bingo-board"
                  type="text"
                  value={slug}
                />
              </div>

              {/* Section: Game Rules */}
              <h2 className="text-lg font-bold text-sky-300 border-b border-gray-700 pb-2 mb-4">Game Rules</h2>

              <div className="space-y-4">
                {/* Checkbox: Announce in Chat */}
                <div className="flex items-center">
                  <input
                    checked={announceInChat}
                    className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                    id="announce-bingo"
                    name="announce-bingo"
                    onChange={({ target: { checked } }) => setAnnounceInChat(checked)}
                    type="checkbox"
                  />

                  <div className="ml-3 text-sm">
                    <label className="font-medium text-gray-300" htmlFor="announce-bingo">
                      Announce Bingo in Chat
                    </label>
                  </div>

                  <Tooltip text="If checked, BinglowBot will announce when a player gets a valid bingo in your Twitch chat, if the game is started via BinglowBot." />
                </div>

                {/* Slider: Heatmap Threshold */}
                <div className="flex items-center mb-1">
                  <label htmlFor="bingo-threshold" className="block text-sm font-medium text-gray-400">
                    Bingo Threshold: <span className="font-bold text-sky-400">{heatmapThreshold}%</span>
                  </label>

                  <Tooltip text="A bingo is only valid if all squares in a line have at least this percentage of community consensus." />
                </div>

                <input
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  id="bingo-threshold"
                  max="100"
                  min="10"
                  onChange={({ target: { value } }) => setHeatmapThreshold(Number(value))}
                  step="5"
                  type="range"
                  value={heatmapThreshold}
                />
              </div>
            </div>
          </div>

          {/* Column (Left): Editable Board */}
          <div className="w-full md:w-2/3 bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-lg font-bold text-sky-300 mb-4 text-center">Board Tiles</h2>
            <EditableBingoBoard tiles={tiles} setTiles={setTiles} />
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center">
          <button
            className="w-full max-w-xs px-8 py-3 bg-sky-500 text-white font-bold rounded-lg hover:bg-sky-600 transition-colors duration-300 text-xl shadow-lg"
            disabled={isSaving}
            onClick={handleSave}
          >
            {isSaving ? "Saving..." : "Save Template"}
          </button>

          <Link href="/" passHref>
            <div className="mt-4 text-gray-400 hover:text-white transition-colors cursor-pointer">
              &larr; Back to Home
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
