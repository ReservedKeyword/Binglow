"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export const HomeHeroSection = () => {
  const { data: currentSession } = useSession();

  return (
    <div className="relative px-6 lg:px-8">
      <div className="mx-auto max-w-2xl py-20 sm:py-32">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Community-Based, Multiplayer Bingo with your Twitch Chat
          </h1>

          <p className="mt-6 text-lg leading-8 text-gray-300">
            Create a custom bingo board, and invite your Twitch community to player, where outcomes are decided with
            real-time, consensus-based gameplay.
          </p>

          <div className="mt-10 flex items-center justify-center gap-x-6">
            {currentSession?.user && (
              <Link
                className="rounded-md bg-sky-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-600"
                href="/create"
              >
                Create a New Board
              </Link>
            )}

            <a className="text-sm font-semibold leading-6 text-white" href="#how-it-works">
              Learn more <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
