import type { NextConfig } from "next";
const isPages = process.env.GITHUB_ACTIONS === "true";
const nextConfig: NextConfig = {
  images: { unoptimized: true },
  basePath: isPages ? "/penthouse-playa-azul" : "",
  assetPrefix: isPages ? "/penthouse-playa-azul/" : "",
  trailingSlash: true,
  ...(isPages ? { output: "export" as const } : {}),
};
export default nextConfig;
