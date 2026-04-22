import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/portal", "/portal/dashboard"],
    },
    sitemap: "https://sudsonwheelsusa.com/sitemap.xml",
  };
}
