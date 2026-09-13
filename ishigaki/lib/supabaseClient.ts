import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// NEXT_PUBLIC_* values are inlined at build time, so a build without them
// produces an app that cannot work. Failing here is deliberate — but say why,
// because the alternative is a stack trace pointing at an unrelated import.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase config: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY " +
      "must both be set in the build environment. Locally that means ishigaki/.env.local; " +
      "on Vercel, Project Settings -> Environment Variables, then redeploy."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
