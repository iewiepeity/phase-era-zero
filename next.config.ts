import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // 明確指定 workspace root，避免偵測到上層 package-lock.json 的誤報
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
