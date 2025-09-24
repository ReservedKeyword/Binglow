"use client";

import { GlobalFooter } from "@binglow/web-service/components/GlobalFooter";
import { GlobalHeader } from "@binglow/web-service/components/GlobalHeader";
import { TRPCReactProvider } from "@binglow/web-service/trpc/react";
import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  return (
    <SessionProvider>
      <TRPCReactProvider>
        <Toaster position="top-center" toastOptions={{ className: "bg-gray-700 text-white" }} />
        <GlobalHeader />
        <main className="flex-grow">{children}</main>
        <GlobalFooter backgroundColor={pathname !== "/" ? "bg-gray-800" : ""} />
      </TRPCReactProvider>
    </SessionProvider>
  );
};
