import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/autorizaciones/", "/api/autorizaciones/"],
      },
    ],
    sitemap: [
      "https://www.ph1401.com/sitemap.xml",
      "https://www.ph1401.com/image-sitemap.xml",
    ],
    host: "https://www.ph1401.com",
  };
}
