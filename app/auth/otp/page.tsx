"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { OtpInput } from "@/components/auth/otp-input";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { sendOtp, verifyOtp } from "@/services/auth";
import { fetchMe } from "@/services/me";
import { useAuthStore } from "@/store/auth-store";

function OtpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const phone = params.get("phone") ?? "";
  const setSession = useAuthStore((s) => s.setSession);
  const setTokens = useAuthStore((s) => s.setTokens);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [seconds, setSeconds] = useState(114);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setTimeout(() => setSeconds((prev) => prev - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  const countdownLabel = useMemo(() => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }, [seconds]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.replace(/\D/g, "").length !== 6) {
      toast.error("Enter the 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      const tokens = await verifyOtp(phone, code.replace(/\D/g, ""));
      setTokens(tokens.access, tokens.refresh);
      const me = await fetchMe();
      setSession(tokens.access, tokens.refresh, me);
      toast.success("You’re in.");
      if (!me.first_name?.trim()) {
        router.replace("/auth/profile");
      } else {
        router.replace(me.role === "mechanic" ? "/mechanic" : "/driver");
      }
    } catch {
      toast.error("Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  }

  if (!phone) {
    return (
      <GlassCard className="w-full max-w-md text-center text-white/70">
        <p>Missing phone. Start from the beginning.</p>
        <Link href="/auth/phone" className="mt-4 inline-block text-[#00E676]">
          Enter phone
        </Link>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="w-full max-w-md border-slate-300/60 bg-white/90 p-6 sm:p-7 dark:border-white/10 dark:bg-[#1a2437]/85">
      <div className="mb-6 space-y-2 text-center">
        <h1 className="font-sora text-3xl font-semibold text-slate-900 dark:text-white">Welcome back</h1>
        <p className="text-sm text-slate-600 dark:text-white/60">
          We sent a 6-digit verification code to{" "}
          <span className="text-slate-900 dark:text-white">{phone}</span>.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-6">
        <OtpInput value={code} onChange={setCode} disabled={loading} />
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Checking..." : "Verify identity"}
        </Button>
      </form>
      <div className="mt-6 text-center">
        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-white/35">
          Didn&apos;t receive code?
        </p>
        <div className="mt-3 inline-flex items-center gap-5 rounded-xl border border-slate-300/70 bg-white px-4 py-2 text-xs text-slate-600 dark:border-white/10 dark:bg-[#111a2b] dark:text-white/70">
          <span>{countdownLabel}</span>
          <button
            type="button"
            onClick={async () => {
              if (seconds > 0 || resending) return;
              setResending(true);
              try {
                await sendOtp(phone);
                setSeconds(114);
                toast.success("New verification code sent.");
              } catch {
                toast.error("Could not resend code.");
              } finally {
                setResending(false);
              }
            }}
            className="font-medium text-[#00E676] disabled:opacity-40"
            disabled={seconds > 0 || resending}
          >
            {resending ? "Resending..." : "Resend"}
          </button>
        </div>
      </div>
      <p className="mt-6 text-center text-sm text-slate-600 dark:text-white/60">
        Wrong number?{" "}
        <Link href="/auth/phone" className="text-[#00E676] hover:underline">
          Back to sign in
        </Link>
      </p>
    </GlassCard>
  );
}

export default function OtpPage() {
  return (
    <Suspense
      fallback={
        <Skeleton className="h-48 w-full max-w-md rounded-2xl" />
      }
    >
      <OtpForm />
    </Suspense>
  );
}
