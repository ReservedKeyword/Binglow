import { PrismaAdapter } from "@auth/prisma-adapter";
import { getPrismaClient } from "@binglow/prisma";
import { webServiceEnvironment } from "@binglow/web-service/environment";
import NextAuth from "next-auth";
import TwitchProvider from "next-auth/providers/twitch";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
    };
  }
}

const { NEXTAUTH_URL, NODE_ENV, TWITCH_APP_CLIENT_ID, TWITCH_APP_CLIENT_SECRET } = webServiceEnvironment;

const prismaClient = getPrismaClient({ nodeEnvironment: NODE_ENV });

const useSecureCookie = NEXTAUTH_URL.startsWith("https://");

const getCookieDomain = () =>
  NODE_ENV === "production" ?
    `.${new URL(NEXTAUTH_URL).hostname.split(".").slice(-2).join(".")}`
  : new URL(NEXTAUTH_URL).hostname;

const authHandler = NextAuth({
  adapter: PrismaAdapter(prismaClient),
  callbacks: {
    session: ({ session, user }) => {
      if (session.user) {
        session.user.id = user.id;
      }

      return session;
    }
  },
  cookies: {
    sessionToken: {
      name: `${useSecureCookie ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        domain: getCookieDomain(),
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: useSecureCookie
      }
    }
  },
  pages: {
    signIn: "/login",
    signOut: "/logout"
  },
  providers: [
    TwitchProvider({
      authorization: {
        params: { scope: "user:read:email" },
        url: "https://id.twitch.tv/oauth2/authorize"
      },
      userinfo: {
        request: async ({ provider: { clientId }, tokens: { access_token: accessToken } }) => {
          if (!accessToken || !clientId) {
            console.error("Cannot fetch OAuth information, access token or client ID is undefined.");
            return null;
          }

          const profileResponse = await fetch("https://api.twitch.tv/helix/users", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Client-ID": clientId
            }
          });

          return (await profileResponse.json()).data[0];
        }
      },
      clientId: TWITCH_APP_CLIENT_ID,
      clientSecret: TWITCH_APP_CLIENT_SECRET,
      idToken: false,
      profile: (profile) => ({
        id: profile.id,
        name: profile.display_name,
        email: profile.email,
        image: profile.profile_image_url
      }),
      token: "https://id.twitch.tv/oauth2/token"
    })
  ]
});

export { authHandler as GET, authHandler as POST };
