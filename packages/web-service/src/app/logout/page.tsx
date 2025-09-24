"use client";

import { LoadingDisplay } from "@binglow/web-service/components/LoadingDisplay";
import { signOut } from "next-auth/react";
import { useEffect, useRef, type JSX } from "react";

const LogoutPage = (): JSX.Element => {
  const isSigningOut = useRef(false);

  useEffect(() => {
    if (!isSigningOut.current) {
      isSigningOut.current = true;
      signOut({ callbackUrl: "/" });
    }
  }, []);

  return <LoadingDisplay message="Signing out..." />;
};

export default LogoutPage;
