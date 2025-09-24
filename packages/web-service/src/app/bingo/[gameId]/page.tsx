"use client";

import type { ActivityEventMessage } from "@binglow/game-service";
import { ActivityFeed } from "@binglow/web-service/components/ActivityFeed";
import { BingoBoard } from "@binglow/web-service/components/BingoBoard";
import { ErrorDisplay } from "@binglow/web-service/components/ErrorDisplay";
import { GameHeader } from "@binglow/web-service/components/GameHeader";
import { LoadingDisplay } from "@binglow/web-service/components/LoadingDisplay";
import { useGameSocket } from "@binglow/web-service/hooks/useGameSocket";
import { useSession } from "next-auth/react";
import type { Params } from "next/dist/server/request/params";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface BingoPageParams extends Params {
  gameId: string;
}

const BingoPage = () => {
  const params = useParams<BingoPageParams>();
  const router = useRouter();
  const { data: currentSession, status: sessionStatus } = useSession();

  const [activityEvents, setActivityEvents] = useState<ActivityEventMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [isBingoOnCooldown, setIsBingoOnCooldown] = useState<boolean>(false);

  const gameId = params.gameId;

  const handleBingoCooldown = useCallback((cooldownSeconds: number) => {
    setIsBingoOnCooldown(true);
    setTimeout(() => setIsBingoOnCooldown(false), cooldownSeconds * 1000);
  }, []);

  const { claimBingo, gameState, selectSquare } = useGameSocket({
    gameId,
    onActivityTriggered: (event) => setActivityEvents((previousEvents) => [event, ...previousEvents].slice(0, 20)),
    onServerError: (err) => setErrorMessage(String(err)),
    startBingoCooldown: handleBingoCooldown,
    userSession: currentSession
  });

  useEffect(() => {
    if (!currentSession && sessionStatus !== "loading") {
      router.push("/");
    }
  }, [currentSession, router, sessionStatus]);

  if (errorMessage) {
    return <ErrorDisplay header="Could Not Join Game" message={errorMessage} />;
  }

  if (!currentSession?.user && sessionStatus === "loading") {
    return <LoadingDisplay message="Loading Session..." />;
  }

  if (!gameState) {
    return <LoadingDisplay message="Joining Game..." />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <GameHeader
          isBingoOnCooldown={isBingoOnCooldown}
          onClaimBingo={claimBingo}
          title={gameState.title}
          username={currentSession!.user.name}
        />

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-2/3">
            <BingoBoard gameState={gameState} onSelectSquare={selectSquare} />
          </div>

          <ActivityFeed events={activityEvents} />
        </div>

        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>Click a square when you think something happened. The percentage shows the community consensus.</p>

          <p>
            A BINGO is only valid if all 5 squares have at least <strong>{gameState.heatmapThreshold}%</strong>{" "}
            consensus!
          </p>
        </div>
      </div>
    </div>
  );
};

export default BingoPage;
