import { NextResponse } from "next/server";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

export type EditorCheck =
  | { ok: true; user: User; asCaller: SupabaseClient }
  | { ok: false; response: NextResponse };

/**
 * Verify the caller holds a session AND is listed in guide_admins, checked
 * against Supabase with their own token rather than trusted from the request.
 *
 * Shared so every privileged route gates the same way — and reports which
 * step failed, since "no token arrived" and "Supabase rejected it" need
 * different fixes.
 */
export async function requireEditor(request: Request): Promise<EditorCheck> {
  const fail = (error: string, status: number) => ({
    ok: false as const,
    response: NextResponse.json({ error }, { status }),
  });

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return fail("No authorization header reached the server.", 401);
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token || token === "undefined" || token === "null") {
    return fail(
      "The browser had no active session to send. Sign out, sign in again, then retry.",
      401
    );
  }

  const asCaller = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: caller, error: callerError } = await asCaller.auth.getUser(token);
  if (callerError || !caller.user) {
    return fail(
      `Supabase rejected the session token: ${callerError?.message ?? "no user returned"}`,
      401
    );
  }

  const { data: isAdmin, error: adminError } = await asCaller.rpc("is_guide_admin");
  if (adminError) {
    return fail(`Could not check editor status: ${adminError.message}`, 403);
  }
  if (isAdmin !== true) {
    return fail(`${caller.user.email} is not listed in guide_admins.`, 403);
  }

  return { ok: true, user: caller.user, asCaller };
}
