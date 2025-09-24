"use client";

export const HomeHowItWorksSection = () => (
  <div id="how-it-works" className="bg-gray-800 py-24 sm:py-32">
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="mx-auto max-w-2xl lg:text-center">
        <h2 className="text-base font-semibold leading-7 text-sky-400">How It Works</h2>
        <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Interact with Chat</p>
        <p className="mt-6 text-lg leading-8 text-gray-300">Get a game up and running in just a few minutes.</p>
      </div>

      <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3 lg:gap-y-16">
          <div className="relative pl-16">
            <dt className="text-base font-semibold leading-7 text-white">
              <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500">
                <span className="text-xl">1</span>
              </div>
              Create Your Board
            </dt>

            <dd className="mt-2 text-base leading-7 text-gray-400">
              Design a custom 5x5 bingo board with your own tiles, and set the rules of the game, including the
              consensus threshold for a valid bingo!
            </dd>
          </div>

          <div className="relative pl-16">
            <dt className="text-base font-semibold leading-7 text-white">
              <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500">
                <span className="text-xl">2</span>
              </div>
              Start the Game (Bot/Web)
            </dt>

            <dd className="mt-2 text-base leading-7 text-gray-400">
              Start a game through our Twitch bot integration, or via the web portal, generating a link that can be
              shared with your community.
            </dd>
          </div>

          <div className="relative pl-16">
            <dt className="text-base font-semibold leading-7 text-white">
              <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500">
                <span className="text-xl">3</span>
              </div>
              Play Together
            </dt>

            <dd className="mt-2 text-base leading-7 text-gray-400">
              As events occur on stream, players will mark their boards. The real-time heatmap shows player consensus,
              and bingos are validated against it!
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
);
