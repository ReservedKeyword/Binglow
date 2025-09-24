"use client";

import type { PingMessage, PongMessage } from "@binglow/game-service";
import { useEffect } from "react";

/**
 * Amount of time, in milliseconds, between each "ping" message
 * we send to the server.
 */
const PING_INTERVAL_MS = 15 * 1000;

/**
 * Amount of time, in milliseconds, for how long we wait for a "pong"
 * response. If a response is not received in this amount of time, the
 * connection is automatically killed.
 */
const PONG_TIMEOUT_MS = 10 * 1000;

export const useGameSocketHeartbeat = (webSocket?: WebSocket | undefined) => {
  useEffect(() => {
    if (!webSocket) return;

    let pingInterval: NodeJS.Timeout;
    let pongTimeout: NodeJS.Timeout;

    const handleMessage = (event: MessageEvent): void => {
      const incomingMessage = JSON.parse(event.data) as PingMessage | PongMessage;

      if (incomingMessage.type === "PING" && webSocket.readyState === WebSocket.OPEN) {
        return webSocket.send(JSON.stringify({ type: "PONG" } as PongMessage));
      }

      if (incomingMessage.type === "PONG") {
        clearTimeout(pongTimeout);
      }
    };

    const startHeartbeat = () => {
      pingInterval = setInterval(() => {
        if (webSocket.readyState === WebSocket.OPEN) {
          // Send a "ping" to our backend
          webSocket.send(JSON.stringify({ type: "PING" } as PingMessage));

          // Start a timeout for a response, killing the connection
          // if we don't receive one in time.
          pongTimeout = setTimeout(() => {
            console.error("Server failed to respond to PING. Killing connection.");
            webSocket.close();
          }, PONG_TIMEOUT_MS);
        }
      }, PING_INTERVAL_MS);
    };

    const stopHeartbeat = () => {
      clearInterval(pingInterval);
      clearTimeout(pongTimeout);
    };

    // Attach our listeners to the WebSocket connection
    webSocket.addEventListener("close", stopHeartbeat);
    webSocket.addEventListener("error", stopHeartbeat);
    webSocket.addEventListener("message", handleMessage);
    webSocket.addEventListener("open", startHeartbeat);

    return () => {
      stopHeartbeat();

      webSocket.removeEventListener("close", stopHeartbeat);
      webSocket.removeEventListener("error", stopHeartbeat);
      webSocket.removeEventListener("message", handleMessage);
      webSocket.removeEventListener("open", startHeartbeat);
    };
  }, [webSocket]);
};
