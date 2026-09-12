import type { MetadataRoute } from "next";

// The guide is invite-only; keep it out of every crawler that honours robots.txt.
// Real enforcement is Supabase auth + RLS — this only stops polite bots.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
