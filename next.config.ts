import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // The monorepo root has its own package.json/pnpm-lock.yaml, which makes
  // Next infer the wrong workspace root and break relative asset resolution.
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
