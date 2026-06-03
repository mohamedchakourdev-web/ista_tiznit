import type { NextConfig } from "next";

const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

let storageDestination: string | null = null;

if (rawApiBaseUrl) {
  try {
    storageDestination = `${new URL(rawApiBaseUrl).origin}/storage/:path*`;
  } catch {
    storageDestination = null;
  }
}

const nextConfig: NextConfig = {
  async rewrites() {
    if (!storageDestination) {
      return [];
    }

    return [
      {
        source: '/storage/:path*',
        destination: storageDestination,
      },
    ];
  },
};

export default nextConfig;
