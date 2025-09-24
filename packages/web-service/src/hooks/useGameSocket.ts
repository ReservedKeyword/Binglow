"use client";

import { webServiceEnvironment } from "../environment";
import type {
  ActivityEventMessage,
  AuthMessage,
  BingoCooldownMessage,
  ClientGameState,
  GameEndedMessage,
  GameStateMessage,
  ServerErrorMessage,
  WebSocketMessage
} from "@binglow/game-service";
import { type Session } from "next-auth";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useGameSocketHeartbeat } from "./useGameSocketHeartbeat";

interface UseGameSocketProps {
  gameId?: string | undefined;
  onActivityTriggered: (event: ActivityEventMessage) => void;
  onServerError?: (err: unknown) => void;
  startBingoCooldown: (cooldownSeconds: number) => void;
  userSession?: Session | null | undefined;
}

export const useGameSocket = ({
  gameId,
  onActivityTriggered,
  onServerError,
  startBingoCooldown,
  userSession
}: UseGameSocketProps) => {
  const userId = userSession?.user.id;
  const username = userSession?.user.name;

  const router = useRouter();
  const [gameState, setGameState] = useState<ClientGameState | undefined>(undefined);
  const [webSocket, setWebSocket] = useState<WebSocket | undefined>(undefined);

  useGameSocketHeartbeat(webSocket);

  const claimBingo = useCallback(
    () => webSocket?.send(JSON.stringify({ type: "CLAIM_BINGO" } as WebSocketMessage)),
    [webSocket]
  );

  const selectSquare = useCallback(
    (squareText: string) =>
      webSocket?.send(
        JSON.stringify({
          type: "SELECT_SQUARE",
          payload: { squareText }
        } as WebSocketMessage)
      ),
    [webSocket]
  );

  useEffect(() => {
    if (!gameId || !userId || !username) {
      return;
    }

    const webSocket = new WebSocket(webServiceEnvironment.NEXT_PUBLIC_WS_URL);
    setWebSocket(webSocket);

    webSocket.addEventListener("open", () => {
      console.log("Successfully connected to WebSocket backend, authenticating...");

      webSocket.send(
        JSON.stringify({
          type: "AUTH",
          payload: {
            gameId,
            userId: userSession.user.id,
            username: userSession.user.name
          }
        } as AuthMessage)
      );
    });

    webSocket.addEventListener("close", () => {
      console.log("WebSocket disconnected!");
    });

    webSocket.addEventListener("error", (err) => {
      console.log("A WebSocket error ocurred: ", err);
    });

    webSocket.addEventListener("message", (event) => {
      const handleActivityEventMessage = (event: ActivityEventMessage) => {
        onActivityTriggered(event);
      };

      const handleBingoCooldownMessage = (event: BingoCooldownMessage) => {
        startBingoCooldown(event.payload.cooldownSeconds);
      };

      const handleGameEndedMessage = (_: GameEndedMessage) => {
        toast.error("This game session has ended.");
        router.push("/");
      };

      const handleGameStateMessage = (event: GameStateMessage) => {
        setGameState(event.payload);
      };

      const handleServerErrorMessage = (event: ServerErrorMessage) => {
        if (typeof onServerError === "function") {
          onServerError?.(event.payload.message);
        } else {
          toast.error(event.payload.message);
        }
      };

      const incomingMessage = JSON.parse(event.data) as WebSocketMessage;

      if (incomingMessage.type === "ACTIVITY_EVENT") handleActivityEventMessage(incomingMessage);
      else if (incomingMessage.type === "BINGO_COOLDOWN") handleBingoCooldownMessage(incomingMessage);
      else if (incomingMessage.type === "GAME_ENDED") handleGameEndedMessage(incomingMessage);
      else if (incomingMessage.type === "GAME_STATE") handleGameStateMessage(incomingMessage);
      else if (incomingMessage.type === "SERVER_ERROR") handleServerErrorMessage(incomingMessage);
    });

    return () => {
      webSocket.close();
    };
  }, [gameId, router, userId, username]);

  return {
    claimBingo,
    gameState,
    selectSquare
  };
};
