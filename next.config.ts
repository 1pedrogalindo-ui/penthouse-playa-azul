import type { NextConfig } from "next";
const isPages = process.env.GITHUB_ACTIONS === "true";
const nextConfig: NextConfig = {
  ...(isPages ? { output: "export" as const } : {}),
  images: { unoptimized: true },
  basePath: isPages ? "/penthouse-playa-azul" : "",
  assetPrefix: isPages ? "/penthouse-playa-azul/" : "",
  trailingSlash: true,
};
export default nextConfig;
