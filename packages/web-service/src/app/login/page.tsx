"use client";

import { LoadingDisplay } from "@binglow/web-service/components/LoadingDisplay";
import { faTwitch } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const LoginPage = () => {
  const router = useRouter();
  const { data: currentSession, status: sessionStatus } = useSession();

  if (sessionStatus === "loading") {
    return <LoadingDisplay message="Loading Session..." />;
  }

  if (currentSession?.user) {
    router.push("/");
    return <LoadingDisplay message="You are logged in, redirecting home..." />;
  }

  return (
    <div className="flex-grow flex items-center justify-center h-full">
      <div className="w-full max-w-md space-y-8 px-4 py-12">
        <div className="bg-gray-800 p-8 shadow-2xl rounded-xl border border-gray-700">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Binglow</h1>
            <p className="text-gray-400">Bingo with your Twitch community</p>
          </div>

          <div className="mt-8">
            <button
              className="flex w-full items-center justify-center gap-3 rounded-md bg-[#9146FF] px-3 py-4 text-white font-semibold shadow-sm hover:bg-[#772CE8] focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#9146FF] transition-colors"
              onClick={() => signIn("twitch", { callbackUrl: "/my-boards" })}
              type="button"
            >
              <FontAwesomeIcon className="h-6 w-6" icon={faTwitch} />
              <span>Sign in with Twitch</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
