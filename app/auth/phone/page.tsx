"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { normalizePhoneHint } from "@/lib/phone";
import { sendOtp } from "@/services/auth";
import { useAuthStore } from "@/store/auth-store";

export default function PhonePage() {
  const router = useRouter();
  const setPendingPhone = useAuthStore((s) => s.setPendingPhone);
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
      await sendOtp(normalized);
      setPendingPhone(normalized);
      toast.success("Code sent.");
      router.push(
        `/auth/otp?phone=${encodeURIComponent(normalized)}`,
      );
    } catch {
      toast.error("Could not send SMS. Check API and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard className="w-full max-w-md border-white/10">
      <div className="mb-6 space-y-2">
        <h1 className="font-sora text-2xl font-semibold text-white">
          Enter your phone
        </h1>
        <p className="text-sm text-white/60">
          We&apos;ll send a one-time code. No passwords — just your number.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-xs font-medium uppercase tracking-wider text-white/50">
          Mobile
        </label>
        <input
          type="tel"
          autoComplete="tel"
          placeholder="+233 54 XXX XXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-lg text-white outline-none ring-[#00E676]/0 transition-all placeholder:text-white/30 focus:border-[#00E676]/50 focus:ring-2 focus:ring-[#00E676]/30"
        />
        <Button
          type="submit"
          className="w-full"
          disabled={loading}
          size="lg"
        >
          {loading ? "Sending…" : "Send code"}
        </Button>
      </form>
      <p className="mt-6 text-center text-xs text-white/40">
        By continuing you agree to AutriFix&apos;s terms.{" "}
        <Link href="/" className="text-[#00E676] hover:underline">
          Home
        </Link>
      </p>
    </GlassCard>
  );
}
