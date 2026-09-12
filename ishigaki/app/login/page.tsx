"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Already signed in? Skip the form.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
    });
  }, [router]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      setStatus(error.message);
      return;
    }
    router.replace("/");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-abyss px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="font-display text-[40px] leading-none text-sand">Ishigaki</div>
          <div className="mt-3 text-[11px] uppercase tracking-[.3em] text-lagoon" lang="ja">
            石垣島
          </div>
        </div>

        <div className="rounded-2xl border border-abyss-2 bg-abyss-2/60 p-8">
          <p className="mb-6 text-center text-[13px] text-chrome-muted">
            A private guide. Sign in to see the map.
          </p>

          <form onSubmit={signIn} className="flex flex-col gap-5">
            <label className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-[.14em] text-chrome-muted">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-abyss-3 bg-abyss px-4 py-3 text-[14px] text-sand placeholder-chrome-muted outline-none transition-colors focus:border-lagoon"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-[.14em] text-chrome-muted">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-abyss-3 bg-abyss px-4 py-3 text-[14px] text-sand placeholder-chrome-muted outline-none transition-colors focus:border-lagoon"
              />
            </label>

            {status && (
              <div className="rounded-lg border border-abyss-3 bg-abyss px-4 py-3 text-[13px] text-coral">
                {status}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-lagoon py-3 text-[12px] uppercase tracking-[.16em] text-abyss transition-colors hover:bg-lagoon-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
