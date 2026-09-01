"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CarFront, Wrench } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { fetchMe, patchCustomerProfile, patchProviderProfile, patchMe } from "@/services/me";
import { useAuthStore } from "@/store/auth-store";
import { AuthCardSkeleton } from "@/components/skeletons/app-skeletons";

export default function ProfilePage() {
  const router = useRouter();
  const { access, user, setSession, patchUser } = useAuthStore();
  const [fullName, setFullName] = useState(
    [user?.first_name, user?.last_name].filter(Boolean).join(" "),
  );
  // Derived, not state: role is fixed at signup and read-only afterwards (ADR-013).
  // It is read here only to route the user to the right side of the app.
  const role = user?.role === "provider" ? "provider" : "customer";
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!access) {
      router.replace("/auth/login");
    }
  }, [access, router]);

  if (!access) {
    return <AuthCardSkeleton />;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const accessToken = access;
    if (!accessToken) {
      router.replace("/auth/login");
      return;
    }
    const [firstName = "", ...rest] = fullName.trim().split(/\s+/);
    const lastName = rest.join(" ");

    if (!firstName) {
      toast.error("Add your first name.");
      return;
    }
    setLoading(true);
    try {
      // Temporary frontend-only mode: allow progressing without backend OTP/me endpoints.
      if (accessToken.startsWith("demo-access-")) {
        const existing = useAuthStore.getState().user;
        if (existing) {
          setSession(accessToken, useAuthStore.getState().refresh ?? "demo-refresh", {
            ...existing,
            first_name: firstName,
            last_name: lastName,
            role,
          });
        }
        toast.success("Profile saved (demo mode).");
        router.replace(role === "provider" ? "/provider" : "/customer");
        return;
      }

      // `role` is deliberately not sent: the backend makes it read-only after signup
      // (ADR-013), so it was being silently dropped — the picker below appeared to work
      // and never did. Recorded as CONFLICT-W001-A in docs/DECISIONS.md; the picker's
      // fate is a product decision, not one to make here.
      const me = await patchMe({
        first_name: firstName,
        last_name: lastName,
      });
      patchUser(me);
      const display = `${firstName} ${lastName}`.trim();
      if (role === "customer") {
        await patchCustomerProfile({ display_name: display });
      } else {
        await patchProviderProfile({ business_name: display });
      }
      const fresh = await fetchMe();
      const { access: a, refresh: r } = useAuthStore.getState();
      if (a && r) setSession(a, r, fresh);
      toast.success("Profile saved.");
      router.replace(role === "provider" ? "/provider" : "/customer");
    } catch {
      toast.error("Could not save profile. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard className="w-full max-w-2xl border-slate-300/60 bg-white/90 p-6 sm:p-7 dark:border-white/10 dark:bg-[#1a2437]/85">
      <div className="mb-6 space-y-3 text-center">
        <div className="mx-auto flex w-48 items-center gap-2">
          <span className="h-1 flex-1 rounded-full bg-[#00E676]" />
          <span className="h-1 flex-1 rounded-full bg-slate-200 dark:bg-white/20" />
          <span className="h-1 flex-1 rounded-full bg-slate-200 dark:bg-white/20" />
        </div>
        <h1 className="font-sora text-3xl font-semibold text-slate-900 dark:text-white">Complete your profile</h1>
        <p className="text-sm text-slate-600 dark:text-white/60">
          Tell us who you are to personalize your roadside experience.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#00E676]/80">
            Full identity
          </label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={loading}
            className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#00E676]/50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/10 dark:bg-[#0f1727] dark:text-white dark:placeholder:text-white/35"
            placeholder="Enter your full name"
          />
        </div>
        {/* Shown, not chosen. The picker that used to live here was silently ignored by
            the backend; the choice now happens before the account exists. */}
        <div>
          <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-white/45">
            Account type
          </label>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-300/70 bg-white/60 px-4 py-3 dark:border-white/10 dark:bg-white/5">
            {role === "provider" ? (
              <Wrench className="h-5 w-5 text-[#00E676]" />
            ) : (
              <CarFront className="h-5 w-5 text-[#00E676]" />
            )}
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                {role === "provider" ? "Provider" : "Customer"}
              </p>
              <p className="text-xs text-slate-500 dark:text-white/45">
                Chosen at signup and cannot be changed here.
              </p>
            </div>
          </div>
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Saving..." : "Initialize profile"}
        </Button>
        <p className="text-center text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-white/35">
          Step 1 of 3: identity setup
        </p>
      </form>
    </GlassCard>
  );
}
