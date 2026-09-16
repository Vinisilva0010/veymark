import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // API routes import shared logic from ../backend/src, which lives outside
  // the Next app directory. This tells Next to trace and compile it.
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
