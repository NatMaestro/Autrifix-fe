"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CarFront, Wrench } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchMe, patchDriverProfile, patchMechanicProfile, patchMe } from "@/services/me";
import { useAuthStore } from "@/store/auth-store";
import { AuthCardSkeleton } from "@/components/skeletons/app-skeletons";

export default function ProfilePage() {
  const router = useRouter();
  const { access, user, setSession, patchUser } = useAuthStore();
  const [fullName, setFullName] = useState(
    [user?.first_name, user?.last_name].filter(Boolean).join(" "),
  );
  const [role, setRole] = useState<"driver" | "mechanic">(
    user?.role === "mechanic" ? "mechanic" : "driver",
  );
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
        router.replace(role === "mechanic" ? "/mechanic" : "/driver");
        return;
      }

      const me = await patchMe({
        first_name: firstName,
        last_name: lastName,
        role,
      });
      patchUser(me);
      const display = `${firstName} ${lastName}`.trim();
      if (role === "driver") {
        await patchDriverProfile({ display_name: display });
      } else {
        await patchMechanicProfile({ business_name: display });
      }
      const fresh = await fetchMe();
      const { access: a, refresh: r } = useAuthStore.getState();
      if (a && r) setSession(a, r, fresh);
      toast.success("Profile saved.");
      router.replace(role === "mechanic" ? "/mechanic" : "/driver");
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
        <div>
          <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-white/45">
            Select role
          </label>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {([
              {
                roleId: "driver",
                title: "Driver",
                desc: "I need roadside assistance, vehicle tracking, and service scheduling.",
                Icon: CarFront,
              },
              {
                roleId: "mechanic",
                title: "Mechanic",
                desc: "I want to provide repair services, manage jobs, and earn through the platform.",
                Icon: Wrench,
              },
            ] as const).map(({ roleId, title, desc, Icon }) => (
              <button
                key={roleId}
                type="button"
                onClick={() => setRole(roleId)}
                disabled={loading}
                className={cn(
                  "rounded-3xl border px-4 py-5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-70",
                  role === roleId
                    ? "border-[#00E676]/75 bg-emerald-50 text-slate-900 shadow-[0_0_0_1px_rgba(0,230,118,0.35)] dark:bg-[#243044] dark:text-white"
                    : "border-slate-300/70 bg-white/60 text-slate-700 hover:border-slate-400/80 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:border-white/20",
                )}
              >
                <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-[#0f1727]">
                  <Icon className="h-5 w-5 text-[#00E676]" />
                </div>
                <p className="font-sora text-2xl font-semibold">{title}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-white/65">{desc}</p>
              </button>
            ))}
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
