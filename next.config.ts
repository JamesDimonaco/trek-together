import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
      {
        protocol: "https",
        hostname: "quixotic-scorpion-92.convex.cloud", // Convex storage
      },
    ],
  },
  // Allow dev server access from local network (for mobile testing)
  allowedDevOrigins: ["192.168.100.*"],
};

export default nextConfig;
