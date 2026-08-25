import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const now = new Date();

  const staticRoutes: Array<{ path: string; priority: number; freq: "daily" | "weekly" | "monthly" | "hourly" | "yearly" }> = [
    { path: "/", priority: 1, freq: "daily" },
    { path: "/tenders", priority: 0.9, freq: "hourly" },
    { path: "/memories", priority: 0.8, freq: "daily" },
    { path: "/cerfa", priority: 0.7, freq: "daily" },
    { path: "/sirene", priority: 0.7, freq: "weekly" },
    { path: "/simulation", priority: 0.7, freq: "weekly" },
    { path: "/mentions-legales", priority: 0.2, freq: "yearly" },
    { path: "/confidentialite", priority: 0.2, freq: "yearly" },
    { path: "/cgu", priority: 0.2, freq: "yearly" },
    { path: "/accessibilite", priority: 0.2, freq: "monthly" },
  ];

  return staticRoutes.map(({ path, priority, freq }) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: freq,
    priority,
  }));
}
