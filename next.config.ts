import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16.3's Vercel adapter does not emit the trace used by standalone.
  // Keep standalone output for the Docker image and self-hosted builds.
  output: process.env.VERCEL === "1" ? undefined : "standalone",
  agentRules: false,
};

export default nextConfig;
