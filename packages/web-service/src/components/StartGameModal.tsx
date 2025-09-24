import toast from "react-hot-toast";

interface StartGameModalProps {
  gameId?: string | undefined;
  onClose: () => void;
}

export const StartGameModal = ({ gameId, onClose }: StartGameModalProps) => {
  if (!gameId) return null;

  const gameLink = `${window.location.origin}/bingo/${gameId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(gameLink);
    toast.success("Link copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 p-6 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-sky-400 mb-4">Game Started!</h2>
        <p className="text-gray-400 mb-4">A new game session has been created. Share the link below with your chat.</p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-left text-gray-400 mb-1" htmlFor="game-link-input">
            Game Link
          </label>

          <div className="flex space-x-2">
            <input
              className="flex-grow p-2 bg-gray-900 border border-gray-600 rounded-lg font-mono text-sm text-white"
              id="game-link-input"
              readOnly
              type="text"
              value={gameLink}
            />

            <button
              className="px-4 py-2 text-sm font-medium bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors cursor-pointer"
              onClick={copyLink}
            >
              Copy
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          Moderators can also use the <code className="bg-gray-900 px-1 rounded">!binglow start</code> command in Twitch
          chat.
        </p>

        <button
          className="w-full px-4 py-2 bg-sky-500 text-white font-bold rounded-lg hover:bg-sky-600 transition-colors cursor-pointer"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};
