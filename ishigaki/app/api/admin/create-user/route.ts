import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Invite a guest. There is no public sign-up: accounts only exist because an
 * editor made one here. The caller must hold a valid session AND be listed in
 * guide_admins — checked against Supabase with their own token, not trusted
 * from the request body.
 */
export async function POST(request: NextRequest) {
  // These failures have different causes and different fixes, so say which.
  // The detail only reaches someone who already holds a session.
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "No authorization header reached the server." },
      { status: 401 }
    );
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token || token === "undefined" || token === "null") {
    return NextResponse.json(
      { error: "The browser had no active session to send. Sign out, sign in again, then retry." },
      { status: 401 }
    );
  }

  const asCaller = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: caller, error: callerError } = await asCaller.auth.getUser(token);
  if (callerError || !caller.user) {
    return NextResponse.json(
      {
        error: `Supabase rejected the session token: ${
          callerError?.message ?? "no user returned"
        }`,
      },
      { status: 401 }
    );
  }

  const { data: isAdmin, error: adminError } = await asCaller.rpc("is_guide_admin");
  if (adminError) {
    return NextResponse.json(
      { error: `Could not check editor status: ${adminError.message}` },
      { status: 403 }
    );
  }
  if (isAdmin !== true) {
    return NextResponse.json(
      { error: `${caller.user.email} is not listed in guide_admins.` },
      { status: 403 }
    );
  }

  const { email, password } = await request.json();

  if (typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const { data, error } = await getSupabaseAdmin().auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ user: { id: data.user.id, email: data.user.email } });
}
