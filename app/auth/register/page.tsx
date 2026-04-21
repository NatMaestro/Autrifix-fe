"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GOOGLE_CLIENT_ID } from "@/lib/constants";
import { normalizePhoneHint } from "@/lib/phone";
import { googleSignIn, registerWithPassword } from "@/services/auth";
import { fetchMe } from "@/services/me";
import { useAuthStore } from "@/store/auth-store";
import type { AuthUser, UserRole } from "@/store/auth-store";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [role, setRole] = useState<"driver" | "mechanic">("driver");
  useEffect(() => {
    const preset = searchParams.get("role");
    if (preset === "mechanic" || preset === "driver") {
      setRole(preset);
    }
  }, [searchParams]);

  const [loading, setLoading] = useState(false);

  const mapRole = (r: string): UserRole => {
    if (r === "mechanic" || r === "admin") return r;
    return "driver";
  };

  const finishWithTokens = useCallback(
    async (access: string, refresh: string) => {
      const me = await fetchMe();
      setSession(access, refresh, me);
      toast.success("Account ready.");
      if (!me.first_name?.trim()) {
        toast.message("Tip", {
          description: "Add your display name anytime under Profile.",
        });
      }
      router.replace(me.role === "mechanic" ? "/mechanic" : "/driver");
    },
    [router, setSession],
  );

  const onGoogleCredential = useCallback(
    async (credential?: string) => {
      if (!credential) {
        toast.error("Google did not return a credential.");
        return;
      }
      setLoading(true);
      try {
        const { access, refresh } = await googleSignIn(credential, role);
        await finishWithTokens(access, refresh);
      } catch (error) {
        const message =
          typeof error === "object" &&
          error &&
          "response" in error &&
          typeof (error as { response?: { data?: { detail?: string } } }).response?.data?.detail === "string"
            ? (error as { response?: { data?: { detail?: string } } }).response!.data!.detail!
            : "Google sign-up failed. Check server configuration and try again.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [finishWithTokens, role],
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
        text: "signup_with",
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
    const emailTrim = email.trim();
    const normalizedPhone = normalizePhoneHint(phone);
    if (!emailTrim || !normalizedPhone || !password || !passwordConfirm) {
      toast.error("Enter email, phone, and password.");
      return;
    }
    if (normalizedPhone.length < 10) {
      toast.error("Enter a valid mobile number.");
      return;
    }
    if (password !== passwordConfirm) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const data = await registerWithPassword({
        email: emailTrim,
        phone: normalizedPhone,
        password,
        password_confirm: passwordConfirm,
        role,
      });
      const user: AuthUser = {
        id: data.id,
        phone: data.phone,
        role: mapRole(data.role),
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
      };
      setSession(data.access, data.refresh, user);
      toast.success("Welcome to AutriFix.");
      if (!user.first_name?.trim()) {
        toast.message("Tip", {
          description: "Add your display name anytime under Profile.",
        });
      }
      router.replace(user.role === "mechanic" ? "/mechanic" : "/driver");
    } catch {
      toast.error("Could not register. That email or phone may already be in use, or the phone format is invalid.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard className="w-full max-w-md border-slate-300/60 bg-white/90 p-6 sm:p-7 dark:border-white/10 dark:bg-[#1a2437]/85">
      <div className="mb-7 space-y-2">
        <p className="text-[10px] uppercase tracking-[0.24em] text-[#00E676]/80">Join AutriFix</p>
        <h1 className="font-sora text-3xl font-semibold text-slate-900 dark:text-white">Create account</h1>
        <p className="text-sm text-slate-600 dark:text-white/60">
          Sign up with Google, or use your email and phone with a password. You can sign in later with either email or
          phone.
        </p>
      </div>

      {GOOGLE_CLIENT_ID ? (
        <div className="mb-6 flex flex-col items-center gap-2">
          <div ref={googleBtnRef} className="min-h-[44px] w-full max-w-[320px]" />
          <p className="text-center text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-white/35">
            or register with password
          </p>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-white/45">
            Email
          </label>
          <input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-base text-slate-900 outline-none ring-[#00E676]/0 transition-all placeholder:text-slate-400 focus:border-[#00E676]/50 focus:ring-2 focus:ring-[#00E676]/25 dark:border-white/10 dark:bg-[#0f1727] dark:text-white dark:placeholder:text-white/30"
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-white/45">
            Phone number
          </label>
          <div className="mt-2 grid grid-cols-[104px_1fr] gap-2">
            <span className="flex items-center rounded-2xl border border-slate-300/70 bg-white px-3 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-[#0f1727] dark:text-white/80">
              +233
            </span>
            <input
              type="tel"
              autoComplete="tel"
              placeholder="54 XXX XXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-base text-slate-900 outline-none ring-[#00E676]/0 transition-all placeholder:text-slate-400 focus:border-[#00E676]/50 focus:ring-2 focus:ring-[#00E676]/25 dark:border-white/10 dark:bg-[#0f1727] dark:text-white dark:placeholder:text-white/30"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-white/45">
            Password
          </label>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-base text-slate-900 outline-none ring-[#00E676]/0 transition-all placeholder:text-slate-400 focus:border-[#00E676]/50 focus:ring-2 focus:ring-[#00E676]/25 dark:border-white/10 dark:bg-[#0f1727] dark:text-white dark:placeholder:text-white/30"
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-white/45">
            Confirm password
          </label>
          <input
            type="password"
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-base text-slate-900 outline-none ring-[#00E676]/0 transition-all placeholder:text-slate-400 focus:border-[#00E676]/50 focus:ring-2 focus:ring-[#00E676]/25 dark:border-white/10 dark:bg-[#0f1727] dark:text-white dark:placeholder:text-white/30"
          />
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-white/45">
            I am a
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole("driver")}
              className={cn(
                "rounded-2xl border px-3 py-3 text-sm font-medium transition-colors",
                role === "driver"
                  ? "border-[#00E676]/60 bg-[#00E676]/10 text-slate-900 dark:text-white"
                  : "border-slate-300/70 text-slate-600 dark:border-white/10 dark:text-white/60",
              )}
            >
              Driver
            </button>
            <button
              type="button"
              onClick={() => setRole("mechanic")}
              className={cn(
                "rounded-2xl border px-3 py-3 text-sm font-medium transition-colors",
                role === "mechanic"
                  ? "border-[#00E676]/60 bg-[#00E676]/10 text-slate-900 dark:text-white"
                  : "border-slate-300/70 text-slate-600 dark:border-white/10 dark:text-white/60",
              )}
            >
              Mechanic
            </button>
          </div>
        </div>
        <Button type="submit" className="mt-2 w-full" disabled={loading} size="lg">
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600 dark:text-white/55">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-[#00E676] hover:underline">
          Sign in
        </Link>
      </p>
    </GlassCard>
  );
}
