"use client";

import { LoadingDisplay } from "@binglow/web-service/components/LoadingDisplay";
import { StartGameModal } from "@binglow/web-service/components/StartGameModal";
import { rpcClient } from "@binglow/web-service/trpc/react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";

const MyBoardsPage = () => {
  const router = useRouter();
  const { data: currentSession, status: sessionStatus } = useSession();
  const [activeGameId, setActiveGameId] = useState<string | undefined>(undefined);

  const myTemplatesQuery = rpcClient.boardTemplate.getMyTemplates.useQuery(undefined, {
    enabled: sessionStatus === "authenticated"
  });

  const startGameMutation = rpcClient.gameAdmin.startGameFromWeb.useMutation({
    onError: (error) => {
      toast.error(`Failed to start game: ${error.message}`);
    },
    onSuccess: (data) => {
      setActiveGameId(data.gameId);
    }
  });

  if (sessionStatus === "loading") {
    return <LoadingDisplay message="Loading Session..." />;
  }

  if (myTemplatesQuery.isLoading) {
    return <LoadingDisplay message="Loading Boards..." />;
  }

  if (sessionStatus === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const boardTemplates = myTemplatesQuery.data ?? [];

  return (
    <>
      <StartGameModal gameId={activeGameId} onClose={() => setActiveGameId(undefined)} />

      <main className="flex-grow bg-gray-900 p-4 sm:p-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-sky-400">
              {currentSession?.user?.name ? `${currentSession.user.name}'s` : "My"} Boards
            </h1>

            <Link
              className="px-4 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors shadow-lg"
              href="/create"
            >
              Create New Board
            </Link>
          </div>

          <div className="space-y-4">
            {boardTemplates.length > 0 ?
              boardTemplates.map((template) => (
                <div
                  className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex flex-col sm:flex-row justify-between items-center"
                  key={template.id}
                >
                  <div>
                    <h2 className="text-xl font-bold text-white">{template.title}</h2>

                    <p className="text-sm text-gray-400 mt-1">
                      Slug: <span className="font-mono text-sky-300">{template.slug}</span>
                    </p>
                  </div>

                  <div className="flex space-x-2 mt-4 sm:mt-0">
                    <button
                      className="px-4 py-2 text-sm font-medium bg-sky-500 rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 cursor-pointer"
                      disabled={startGameMutation.isPending}
                      onClick={() => startGameMutation.mutate({ slug: template.slug })}
                    >
                      {startGameMutation.isPending ? "Starting..." : "Start Game"}
                    </button>
                  </div>
                </div>
              ))
            : <div className="bg-gray-800 rounded-xl border-2 border-dashed border-gray-700 p-12 text-center">
                <h3 className="text-lg font-medium text-white">No boards yet!</h3>
                <p className="mt-1 text-sm text-gray-400">Get started by creating your first bingo board.</p>
                <div className="mt-6">
                  <Link
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-500 hover:bg-green-600"
                    href="/create"
                  >
                    Create a New Board
                  </Link>
                </div>
              </div>
            }
          </div>
        </div>
      </main>
    </>
  );
};

export default MyBoardsPage;
