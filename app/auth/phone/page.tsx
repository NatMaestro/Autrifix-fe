"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { ENABLE_OTP_BYPASS } from "@/lib/constants";
import { normalizePhoneHint } from "@/lib/phone";
import { sendOtp } from "@/services/auth";
import { useAuthStore } from "@/store/auth-store";

export default function PhonePage() {
  const router = useRouter();
  const setPendingPhone = useAuthStore((s) => s.setPendingPhone);
  const setSession = useAuthStore((s) => s.setSession);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizePhoneHint(phone);
    if (normalized.length < 10) {
      toast.error("Enter a valid mobile number.");
      return;
    }
    setLoading(true);
    try {
      setPendingPhone(normalized);
      if (ENABLE_OTP_BYPASS) {
        // Optional frontend-only mode for UI reviews when backend OTP is unavailable.
        const existing = useAuthStore.getState().user;
        const accessToken = `demo-access-${normalized}`;
        const refreshToken = `demo-refresh-${normalized}`;

        if (existing && existing.phone === normalized && existing.first_name?.trim()) {
          setSession(accessToken, refreshToken, {
            ...existing,
            phone: normalized,
          });
          toast.success("Welcome back.");
          router.push(existing.role === "mechanic" ? "/mechanic" : "/driver");
          return;
        }

        setSession(accessToken, refreshToken, {
          id: existing?.id ?? `demo-${normalized}`,
          phone: normalized,
          role: existing?.role ?? "driver",
          first_name: existing?.first_name,
          last_name: existing?.last_name,
          email: existing?.email,
        });
        toast.success("OTP bypass is enabled. Complete your profile once.");
        router.push("/auth/profile");
        return;
      }

      await sendOtp(normalized);
      toast.success("Verification code sent.");
      router.push(`/auth/otp?phone=${encodeURIComponent(normalized)}`);
    } catch {
      toast.error("Could not send code. Check backend/SMS config and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard className="w-full max-w-md border-slate-300/60 bg-white/90 p-6 sm:p-7 dark:border-white/10 dark:bg-[#1a2437]/85">
      <div className="mb-7 space-y-2">
        <p className="text-[10px] uppercase tracking-[0.24em] text-[#00E676]/80">
          Secure access
        </p>
        <h1 className="font-sora text-3xl font-semibold text-slate-900 dark:text-white">Continue with phone</h1>
        <p className="text-sm text-slate-600 dark:text-white/60">
          Enter your mobile number to continue. We&apos;ll create an account automatically if
          you&apos;re new.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-xs font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-white/45">
          Phone number
        </label>
        <div className="grid grid-cols-[104px_1fr] gap-2">
          <button
            type="button"
            className="rounded-2xl border border-slate-300/70 bg-white px-3 py-3 text-left text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-[#0f1727] dark:text-white/80"
          >
            +233
          </button>
          <input
            type="tel"
            autoComplete="tel"
            placeholder="54 XXX XXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-base text-slate-900 outline-none ring-[#00E676]/0 transition-all placeholder:text-slate-400 focus:border-[#00E676]/50 focus:ring-2 focus:ring-[#00E676]/25 dark:border-white/10 dark:bg-[#0f1727] dark:text-white dark:placeholder:text-white/30"
          />
        </div>
        <Button
          type="submit"
          className="mt-2 w-full"
          disabled={loading}
          size="lg"
        >
          {loading ? "Sending code..." : "Continue"}
        </Button>
      </form>
      <p className="mt-6 text-center text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-white/35">
        By continuing you agree to AutriFix&apos;s terms.{" "}
        <Link href="/" className="text-[#00E676] hover:underline">
          Back
        </Link>
      </p>
    </GlassCard>
  );
}
