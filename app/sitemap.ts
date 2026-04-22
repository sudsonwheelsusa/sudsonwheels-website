import type { MetadataRoute } from "next";

const LAUNCH_DATE = new Date("2026-04-22");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://sudsonwheelsusa.com",
      lastModified: LAUNCH_DATE,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: "https://sudsonwheelsusa.com/services",
      lastModified: LAUNCH_DATE,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://sudsonwheelsusa.com/about",
      lastModified: LAUNCH_DATE,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://sudsonwheelsusa.com/contact",
      lastModified: LAUNCH_DATE,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://sudsonwheelsusa.com/gallery",
      lastModified: LAUNCH_DATE,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];
}
