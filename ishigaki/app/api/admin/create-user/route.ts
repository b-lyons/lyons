import { NextRequest, NextResponse } from "next/server";
import { requireEditor } from "@/lib/apiAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Invite a guest. There is no public sign-up: accounts only exist because an
 * editor made one here.
 */
export async function POST(request: NextRequest) {
  const auth = await requireEditor(request);
  if (!auth.ok) return auth.response;

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
