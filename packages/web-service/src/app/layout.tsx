import { Providers } from "@binglow/web-service/app/providers";
import "@binglow/web-service/styles/globals.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";

config.autoAddCss = false;

export const metadata = { title: "Binglow | Multiplayer Bingo" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className="h-full" lang="en">
      <body className="h-full flex flex-col bg-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
