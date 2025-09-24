"use client";

import { HomeHeroSection } from "@binglow/web-service/components/HomeHeroSection";
import { HomeHowItWorksSection } from "@binglow/web-service/components/HomeHowItWorksSection";
import { LoadingDisplay } from "@binglow/web-service/components/LoadingDisplay";
import { useSession } from "next-auth/react";

export default function Home() {
  const { status: sessionStatus } = useSession();

  if (sessionStatus === "loading") {
    return <LoadingDisplay message="Loading Session..." />;
  }

  return (
    <main>
      <HomeHeroSection />
      <HomeHowItWorksSection />
    </main>
  );
}
