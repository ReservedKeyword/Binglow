"use client";

import type { ActivityEventMessage } from "@binglow/game-service";
import { ActivityFeedItem } from "@binglow/web-service/components/ActivityFeedItem";

interface ActivityFeedProps {
  events: ActivityEventMessage[];
}

export const ActivityFeed = ({ events }: ActivityFeedProps) => (
  <div className="w-full lg:w-1/3 bg-gray-800 rounded-xl shadow-inner p-4 flex flex-col h-[400px] lg:h-auto">
    <h2 className="text-lg font-bold text-sky-300 mb-4 border-b border-gray-700 pb-2 flex-shrink-0">Activity Feed</h2>
    <ul className="space-y-3 overflow-y-auto flex-grow pr-2">
      {events.map((event, index) => (
        <ActivityFeedItem event={event} key={index} />
      ))}

      {events.length === 0 && <p className="text-gray-500 text-center italic mt-4">Waiting for players...</p>}
    </ul>
  </div>
);
