import type { NextConfig } from "next";
const isPages = process.env.GITHUB_ACTIONS === "true";
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: isPages ? "/penthouse-playa-azul" : "",
  assetPrefix: isPages ? "/penthouse-playa-azul/" : "",
  trailingSlash: true,
};
export default nextConfig;
