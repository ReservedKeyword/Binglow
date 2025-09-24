"use client";

import type { ActivityEventMessage } from "@binglow/game-service";
import { useTimeAgo } from "@binglow/web-service/hooks/useTimeAgo";
import { faPlug, faSignInAlt, faSignOutAlt, faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { JSX } from "react";

interface ActivityFeedItem {
  event: ActivityEventMessage;
}

interface EventPayloadConfigItem {
  icon: JSX.Element;
  tailwindColors: string;
  text: string;
}

type EventPayloadConfig = Record<ActivityEventMessage["payload"]["eventType"], EventPayloadConfigItem>;

const eventPayloadConfig: EventPayloadConfig = {
  bingo: {
    icon: <FontAwesomeIcon className="mr-3 flex-shrink-0 text-yellow-400" icon={faStar} />,
    tailwindColors: "bg-yellow-500/10 text-yellow-300",
    text: "got a BINGO!"
  },
  join: {
    icon: <FontAwesomeIcon className="mr-3 flex-shrink-0 text-green-400" icon={faSignInAlt} />,
    tailwindColors: "bg-green-500/10 text-green-300",
    text: "joined the game."
  },
  leave: {
    icon: <FontAwesomeIcon className="mr-3 flex-shrink-0 text-red-400" icon={faSignOutAlt} />,
    tailwindColors: "bg-red-500/10 text-red-400",
    text: "left the game."
  },
  reconnected: {
    icon: <FontAwesomeIcon className="mr-3 flex-shrink-0 text-sky-400" icon={faPlug} />,
    tailwindColors: "bg-sky-500/10 text-sky-300",
    text: "reconnected to the game."
  }
};

export const ActivityFeedItem = ({
  event: {
    payload: { eventType, timestamp, username }
  }
}: ActivityFeedItem) => {
  const { icon, tailwindColors, text } = eventPayloadConfig[eventType];
  const timeAgo = useTimeAgo(timestamp);

  return (
    <li className={`flex items-center p-2 rounded-md transition-all duration-300 ${tailwindColors}`}>
      {icon}

      <span className="flex-grow text-sm">
        <span className="font-bold">{username}</span> {text}
      </span>

      <span className="text-xs text-gray-500 flex-shrink-0">{timeAgo}</span>
    </li>
  );
};
