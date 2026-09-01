"use client";

import { CarFront, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { ENABLE_OTP_BYPASS, GOOGLE_CLIENT_ID } from "@/lib/constants";
import type { SignupRole } from "@/lib/api-schema";
import { loginWithPassword, googleSignIn, isSignupRoleRequired } from "@/services/auth";
import { fetchMe } from "@/services/me";
import { useAuthStore } from "@/store/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const setTokens = useAuthStore((s) => s.setTokens);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  // Held while we ask a first-time Google user which role they want. Nothing has been
  // created at this point, and the credential is reusable for the retry.
  const [pendingCredential, setPendingCredential] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const finishWithTokens = useCallback(
    async (access: string, refresh: string) => {
      setTokens(access, refresh);
      const me = await fetchMe();
      const { access: a, refresh: r } = useAuthStore.getState();
      if (a && r) setSession(a, r, me);
      toast.success("Signed in.");
      if (!me.first_name?.trim()) {
        toast.message("Tip", {
          description: "Add your display name anytime under Profile.",
        });
      }
      router.replace(me.role === "provider" ? "/provider" : "/customer");
    },
    [router, setSession, setTokens],
  );

  const onGoogleCredential = useCallback(
    async (credential?: string, role?: SignupRole) => {
      if (!credential) {
        toast.error("Google did not return a credential.");
        return;
      }
      setLoading(true);
      try {
        const { access, refresh } = await googleSignIn(credential, role);
        setPendingCredential(null);
        await finishWithTokens(access, refresh);
      } catch (error) {
        if (isSignupRoleRequired(error)) {
          // No account exists for this Google identity. The backend refuses to guess a
          // role because it is permanent (ADR-013), so ask before creating anything.
          setPendingCredential(credential);
          return;
        }
        toast.error("Google sign-in failed. Check server configuration and try again.");
      } finally {
        setLoading(false);
      }
    },
    [finishWithTokens],
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleBtnRef.current) return;

    let cancelled = false;
    const el = googleBtnRef.current;

    function render() {
      if (cancelled || !window.google?.accounts?.id || !el) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (cred) => {
          void onGoogleCredential(cred.credential);
        },
      });
      window.google.accounts.id.renderButton(el, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
        type: "standard",
      });
    }

    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      if (window.google?.accounts?.id) render();
      else existing.addEventListener("load", render);
      return () => {
        cancelled = true;
        existing.removeEventListener("load", render);
      };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => render();
    document.body.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [onGoogleCredential]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = identifier.trim();
    if (!id || !password) {
      toast.error("Enter your email or phone and password.");
      return;
    }
    setLoading(true);
    try {
      if (ENABLE_OTP_BYPASS) {
        const accessToken = `demo-access-${id}`;
        const refreshToken = `demo-refresh-${id}`;
        const existing = useAuthStore.getState().user;
        setSession(accessToken, refreshToken, {
          id: existing?.id ?? `demo-${id}`,
          phone: id.includes("@") ? null : id,
          role: existing?.role ?? "customer",
          first_name: existing?.first_name,
          last_name: existing?.last_name,
          email: id.includes("@") ? id : existing?.email,
        });
        toast.success("Demo bypass: signed in.");
        router.replace(
          (existing?.role ?? "customer") === "provider" ? "/provider" : "/customer",
        );
        return;
      }

      const { access, refresh } = await loginWithPassword(id, password);
      await finishWithTokens(access, refresh);
    } catch {
      toast.error("Invalid credentials or server error.");
    } finally {
      setLoading(false);
    }
  }

  // First-time Google user: the account does not exist yet and the backend will not
  // invent a role for it, so this is the last moment the choice can still be made.
  if (pendingCredential) {
    return (
      <GlassCard className="w-full max-w-md border-slate-300/60 bg-white/90 p-6 sm:p-7 dark:border-white/10 dark:bg-[#1a2437]/85">
        <div className="mb-6 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[#00E676]/80">One more step</p>
          <h1 className="font-sora text-3xl font-semibold text-slate-900 dark:text-white">
            How will you use Autrifix?
          </h1>
          <p className="text-sm text-slate-600 dark:text-white/60">
            This cannot be changed later, so pick the one that fits.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {([
            { roleId: "customer" as const, title: "Customer", desc: "I need help with my vehicle.", Icon: CarFront },
            { roleId: "provider" as const, title: "Provider", desc: "I repair vehicles or tow them.", Icon: Wrench },
          ]).map(({ roleId, title, desc, Icon }) => (
            <button
              key={roleId}
              type="button"
              disabled={loading}
              onClick={() => void onGoogleCredential(pendingCredential, roleId)}
              className="rounded-3xl border border-slate-300/70 bg-white/60 px-4 py-5 text-left transition-all hover:border-[#00E676]/75 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/10 dark:bg-white/5 dark:hover:border-[#00E676]/75"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-[#0f1727]">
                <Icon className="h-5 w-5 text-[#00E676]" />
              </div>
              <p className="font-sora text-xl font-semibold text-slate-900 dark:text-white">{title}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-white/60">{desc}</p>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setPendingCredential(null)}
          className="mt-5 text-sm text-slate-500 underline dark:text-white/45"
        >
          Cancel
        </button>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="w-full max-w-md border-slate-300/60 bg-white/90 p-6 sm:p-7 dark:border-white/10 dark:bg-[#1a2437]/85">
      <div className="mb-7 space-y-2">
        <p className="text-[10px] uppercase tracking-[0.24em] text-[#00E676]/80">Secure access</p>
        <h1 className="font-sora text-3xl font-semibold text-slate-900 dark:text-white">Sign in</h1>
        <p className="text-sm text-slate-600 dark:text-white/60">
          Use your email or mobile number and password. Google sign-in is available when configured.
        </p>
      </div>

      {GOOGLE_CLIENT_ID ? (
        <div className="mb-6 flex flex-col items-center gap-2">
          <div ref={googleBtnRef} className="min-h-[44px] w-full max-w-[320px]" />
          <p className="text-center text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-white/35">
            or continue with password
          </p>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-white/45">
            Email or phone
          </label>
          <input
            type="text"
            autoComplete="username"
            placeholder="you@example.com or +233…"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-base text-slate-900 outline-none ring-[#00E676]/0 transition-all placeholder:text-slate-400 focus:border-[#00E676]/50 focus:ring-2 focus:ring-[#00E676]/25 dark:border-white/10 dark:bg-[#0f1727] dark:text-white dark:placeholder:text-white/30"
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-white/45">
            Password
          </label>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-base text-slate-900 outline-none ring-[#00E676]/0 transition-all placeholder:text-slate-400 focus:border-[#00E676]/50 focus:ring-2 focus:ring-[#00E676]/25 dark:border-white/10 dark:bg-[#0f1727] dark:text-white dark:placeholder:text-white/30"
          />
        </div>
        <Button type="submit" className="mt-2 w-full" disabled={loading} size="lg">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600 dark:text-white/55">
        New here?{" "}
        <Link href="/auth/register" className="font-medium text-[#00E676] hover:underline">
          Create an account
        </Link>
      </p>
      <p className="mt-4 text-center text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-white/35">
        <Link href="/" className="text-[#00E676] hover:underline">
          Back home
        </Link>
      </p>
    </GlassCard>
  );
}
