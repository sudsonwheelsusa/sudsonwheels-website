import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date("2026-04-28");

  return [
    {
      url: "https://sudsonwheelsusa.com",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: "https://sudsonwheelsusa.com/services",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://sudsonwheelsusa.com/about",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://sudsonwheelsusa.com/contact",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://sudsonwheelsusa.com/gallery",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];
}
