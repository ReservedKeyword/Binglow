"use client";

interface GameHeaderProps {
  isBingoOnCooldown: boolean;
  onClaimBingo: () => void;
  title: string;
  username: string;
}

export const GameHeader = ({ isBingoOnCooldown, onClaimBingo, title, username }: GameHeaderProps) => (
  <div className="flex justify-between items-center mb-6">
    <div>
      <h1 className="text-3xl sm:text-4xl font-bold text-sky-400">{title}</h1>
      <p className="text-gray-400 mt-2">Welcome, {username}</p>
    </div>

    <div className="flex space-x-2">
      <button
        className={`px-6 py-3 font-bold rounded-lg transition-colors duration-300 shadow-lg text-xl ${
          isBingoOnCooldown ?
            "bg-yellow-800 text-yellow-500 cursor-not-allowed"
          : "bg-yellow-500 text-black hover:bg-yellow-400 animate-pulse"
        }`}
        disabled={isBingoOnCooldown}
        onClick={onClaimBingo}
      >
        BINGO!
      </button>
    </div>
  </div>
);
