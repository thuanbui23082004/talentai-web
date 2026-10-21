import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
