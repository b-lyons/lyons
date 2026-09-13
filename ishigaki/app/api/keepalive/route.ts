import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Keeps the Supabase project awake.
 *
 * Free-tier projects pause after about a week without requests, and restoring
 * one is a manual click in the dashboard — which is fine, except that nobody
 * finds out until a guest opens the guide and it is dead. Vercel Cron calls
 * this once a day so that does not happen while the guide sits unused.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Vercel attaches this header to cron invocations whenever CRON_SECRET is
  // set. Without it the route still works, so the cron does not silently
  // break if the variable is missing — it just stops being private.
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  // A real query rather than a ping: it is the database that has to stay warm,
  // not the web server. Service role, so RLS cannot quietly turn this into a
  // request that succeeds without touching Postgres at all.
  const { error } = await getSupabaseAdmin().from("places").select("id").limit(1);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
