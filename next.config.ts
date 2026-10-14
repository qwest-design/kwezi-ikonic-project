import type { NextConfig } from "next";

/** WordPress media is served from the GraphQL host; next/image may only optimise listed hosts. */
const wordpressHost = (() => {
  try {
    return process.env.WORDPRESS_GRAPHQL_URL ? new URL(process.env.WORDPRESS_GRAPHQL_URL) : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: wordpressHost
      ? [{ protocol: wordpressHost.protocol.replace(":", "") as "http" | "https", hostname: wordpressHost.hostname, pathname: "/wp-content/uploads/**" }]
      : [],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
