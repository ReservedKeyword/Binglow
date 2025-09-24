"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const GlobalHeader = () => {
  const pathname = usePathname();
  const { data: currentSession } = useSession();

  const navLinkClasses = (path: string) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === path ? "bg-sky-600 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"}`;

  return (
    <header className="bg-gray-800 border-t border-gray-700 mt-auto top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" passHref>
              <div className="flex-shrink-0 text-white font-bold text-xl cursor-pointer">Binglow</div>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link className={navLinkClasses("/")} href="/" passHref>
                Home
              </Link>

              {currentSession?.user ?
                <>
                  <Link className={navLinkClasses("/my-boards")} href="/my-boards" passHref>
                    My Boards
                  </Link>

                  <Link className={navLinkClasses("/logout")} href="/logout" passHref>
                    Logout
                  </Link>
                </>
              : <>
                  <Link className={navLinkClasses("/login")} href="/login" passHref>
                    Login
                  </Link>
                </>
              }
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
