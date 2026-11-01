import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let Playwright run a fresh mock server alongside local development.
  distDir: process.env.PLAYWRIGHT_TEST === "1" ? ".next-e2e" : ".next",
  // Keep the baseline on stable defaults while features and auth are built.
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
