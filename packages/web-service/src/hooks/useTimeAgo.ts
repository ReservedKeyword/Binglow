"use client";

import { useEffect, useState } from "react";

const formatTimeAgo = (isoString: string): string => {
  const isoDate = new Date(isoString);

  const secondsAgo = Math.floor((new Date().getTime() - isoDate.getTime()) / 1000);
  if (secondsAgo < 10) return "just now";
  if (secondsAgo < 60) return `${secondsAgo}s ago`;

  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) return `${minutesAgo}m ago`;

  const hours = Math.floor(minutesAgo / 60);

  return `${hours}h ago`;
};

export const useTimeAgo = (isoString: string) => {
  const [timeAgo, setTimeAgo] = useState(() => formatTimeAgo(isoString));

  useEffect(() => {
    const updateInterval = setInterval(() => {
      setTimeAgo(formatTimeAgo(isoString));
    }, 1000);

    return () => clearInterval(updateInterval);
  }, [isoString]);

  return timeAgo;
};
