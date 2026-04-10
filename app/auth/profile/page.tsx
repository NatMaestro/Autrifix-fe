"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchMe, patchDriverProfile, patchMechanicProfile, patchMe } from "@/services/me";
import { useAuthStore } from "@/store/auth-store";

export default function ProfilePage() {
  const router = useRouter();
  const { access, user, setSession, patchUser } = useAuthStore();
  const [first, setFirst] = useState(user?.first_name ?? "");
  const [last, setLast] = useState(user?.last_name ?? "");
  const [role, setRole] = useState<"driver" | "mechanic">(
    user?.role === "mechanic" ? "mechanic" : "driver",
  );
  const [loading, setLoading] = useState(false);

  if (!access) {
    router.replace("/auth/phone");
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!first.trim()) {
      toast.error("Add your first name.");
      return;
    }
    setLoading(true);
    try {
      const me = await patchMe({
        first_name: first.trim(),
        last_name: last.trim(),
        role,
      });
      patchUser(me);
      const display = `${first.trim()} ${last.trim()}`.trim();
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
    <GlassCard className="w-full max-w-md border-white/10">
      <div className="mb-6 space-y-2">
        <h1 className="font-sora text-2xl font-semibold text-white">
          Who&apos;s driving this?
        </h1>
        <p className="text-sm text-white/60">
          Your name and role power routing, badges, and chat labels.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-white/50">
              First name
            </label>
            <input
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#00E676]/50"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-white/50">
              Last name
            </label>
            <input
              value={last}
              onChange={(e) => setLast(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#00E676]/50"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-white/50">
            I am a
          </label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(["driver", "mechanic"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  "rounded-2xl border px-3 py-3 text-sm font-medium capitalize transition-all",
                  role === r
                    ? "border-[#00E676]/60 bg-[#00E676]/15 text-[#00E676]"
                    : "border-white/10 bg-white/5 text-white/70 hover:border-white/20",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Saving…" : "Enter AutriFix"}
        </Button>
      </form>
    </GlassCard>
  );
}
