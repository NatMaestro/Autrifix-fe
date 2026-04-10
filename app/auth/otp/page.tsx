"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

import { OtpInput } from "@/components/auth/otp-input";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { fetchMe } from "@/services/me";
import { verifyOtp } from "@/services/auth";
import { useAuthStore } from "@/store/auth-store";

function OtpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const phone = params.get("phone") ?? "";
  const setSession = useAuthStore((s) => s.setSession);
  const setTokens = useAuthStore((s) => s.setTokens);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

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
    <GlassCard className="w-full max-w-md border-white/10">
      <div className="mb-6 space-y-2">
        <h1 className="font-sora text-2xl font-semibold text-white">
          Verify code
        </h1>
        <p className="text-sm text-white/60">
          Sent to <span className="text-white">{phone}</span>
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-6">
        <OtpInput value={code} onChange={setCode} disabled={loading} />
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Checking…" : "Verify & continue"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-white/60">
        Wrong number?{" "}
        <Link href="/auth/phone" className="text-[#00E676] hover:underline">
          Edit
        </Link>
      </p>
    </GlassCard>
  );
}

export default function OtpPage() {
  return (
    <Suspense
      fallback={
        <div className="h-48 w-full max-w-md animate-pulse rounded-2xl bg-white/5" />
      }
    >
      <OtpForm />
    </Suspense>
  );
}
