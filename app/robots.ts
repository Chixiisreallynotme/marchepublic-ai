import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Les dossiers utilisateurs et formulaires de création ne sont pas
        // destinés à l'indexation.
        disallow: ["/api/", "/tenders/new", "/tenders/*/memory", "/tenders/*/cerfa"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
