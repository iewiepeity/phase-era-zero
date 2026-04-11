import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // worktree 環境：將 workspace root 設為上層專案目錄（node_modules 在那裡）
    root: path.resolve(__dirname, "../../.."),
  },
};

export default nextConfig;
