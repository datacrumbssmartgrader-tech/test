import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // This resolves the absolute path warning completely
    root: path.resolve(__dirname), 
  },
};

export default nextConfig;