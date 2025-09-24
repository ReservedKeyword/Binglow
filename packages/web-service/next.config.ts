import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.0.0.214"],
  logging: {
    fetches: {
      fullUrl: true,
      hmrRefreshes: true
    }
  },
  output: "standalone",
  poweredByHeader: false
};

export default nextConfig;
