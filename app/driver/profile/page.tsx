"use client";

import {
  Bell,
  ChevronRight,
  CircleUserRound,
  CreditCard,
  HelpCircle,
  LogOut,
  Shield,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { uploadAvatar } from "@/services/me";

const SETTINGS = [
  {
    id: "account",
    title: "Account settings",
    subtitle: "Security, password, personal info",
    Icon: Shield,
  },
  {
    id: "payments",
    title: "Payment methods",
    subtitle: "Linked banks and digital wallets",
    Icon: CreditCard,
  },
  {
    id: "notifications",
    title: "Notification preferences",
    subtitle: "Manage push and SMS alerts",
    Icon: Bell,
  },
  {
    id: "support",
    title: "Operator support",
    subtitle: "24/7 dedicated dispatch assistance",
    Icon: HelpCircle,
  },
] as const;

export default function DriverProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const patchUser = useAuthStore((s) => s.patchUser);
  const [activeId, setActiveId] = useState<(typeof SETTINGS)[number]["id"]>("account");
  const [modalOpen, setModalOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  const displayName = useMemo(() => {
    if (!user) return "Marcus Thorne";
    const fn = user.first_name?.trim();
    const ln = user.last_name?.trim();
    if (fn) return `${fn} ${ln ?? ""}`.trim();
    return "Marcus Thorne";
  }, [user]);

  const loginId = user?.phone ?? user?.email ?? "—";
  const email = user?.email ?? null;

  function onAvatarSelected(file: File | null) {
    setAvatarFile(file);
    if (!file) {
      setAvatarPreview(null);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  }

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [user?.avatar]);

  useEffect(() => {
    if (modalOpen) return;
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarSaving(false);
  }, [modalOpen]);

  return (
    <div className="flex min-h-dvh justify-center px-4 pb-28 pt-6 mt-10">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <span className="mx-auto inline-flex h-24 w-24 items-center justify-center rounded-full bg-[#163b34] text-[#8df6ba]">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Selected profile avatar" className="h-full w-full rounded-full object-cover" />
            ) : user?.avatar && !avatarLoadFailed ? (
              <img
                src={user.avatar}
                alt="Profile avatar"
                className="h-full w-full rounded-full object-cover"
                onError={() => setAvatarLoadFailed(true)}
              />
            ) : (
              <CircleUserRound className="h-14 w-14" />
            )}
          </span>
          <h1 className="mt-4 font-sora text-6xl font-semibold text-slate-900 dark:text-white">
            {displayName}
          </h1>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-white/55">
            Elite kinetic operator
          </p>
          <div className="mt-4 flex items-center justify-center gap-10 text-center">
            <div>
              <p className="font-sora text-4xl font-semibold text-[#8df6ba]">1.2k</p>
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-white/45">
                Total jobs
              </p>
            </div>
            <div>
              <p className="font-sora text-4xl font-semibold text-[#8df6ba]">98%</p>
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-white/45">
                Success
              </p>
            </div>
            <div>
              <p className="font-sora text-4xl font-semibold text-[#8df6ba]">3y</p>
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-white/45">
                Tenure
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {SETTINGS.map(({ id, title, subtitle, Icon }) => (
            <GlassCard
              key={title}
              className="border-slate-300/70 bg-white/90 dark:border-white/10 dark:bg-[#273246]/90"
            >
              <button
                type="button"
                onClick={() => {
                  setActiveId(id);
                  setModalOpen(true);
                }}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-[#1c2b42]">
                  <Icon className="h-5 w-5 text-[#9deac0]" />
                </span>
                <span className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">{title}</p>
                  <p className="text-sm text-slate-600 dark:text-white/55">{subtitle}</p>
                </span>
                <ChevronRight className="h-4 w-4 text-slate-500 dark:text-white/50" />
              </button>
            </GlassCard>
          ))}
          <GlassCard className="border-red-500/20 bg-red-50/60 dark:bg-[#3a1020]/80 dark:border-red-500/20">
            <button
              type="button"
              onClick={() => {
                logout();
                router.replace("/auth/login");
              }}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 dark:bg-[#4c1a2b]">
                <LogOut className="h-5 w-5 text-red-600 dark:text-[#f0b6b7]" />
              </span>
              <span className="flex-1 pl-3">
                <p className="font-medium text-red-700 dark:text-[#f0b6b7]">Logout</p>
                <p className="text-sm text-slate-600 dark:text-white/60">
                  End current active session
                </p>
              </span>
              <ChevronRight className="h-4 w-4 text-red-600/60 dark:text-[#f0b6b7]/70" />
            </button>
          </GlassCard>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-white/60">
          Select a card to manage your account settings.
        </p>

        {modalOpen ? (
          <div
            className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 p-3 sm:items-center"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setModalOpen(false);
            }}
          >
            <GlassCard className="max-h-[90dvh] w-full max-w-3xl overflow-y-auto border-slate-300/70 bg-white/95 p-5 sm:p-6 dark:border-white/10 dark:bg-[#1a2437]/95">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {activeId === "account" ? (
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-white/45">
                      Account settings
                    </p>
                  ) : activeId === "payments" ? (
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-white/45">
                      Payment methods
                    </p>
                  ) : activeId === "notifications" ? (
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-white/45">
                      Notification preferences
                    </p>
                  ) : (
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-white/45">
                      Operator support
                    </p>
                  )}
                  <p className="mt-1 font-sora text-2xl font-semibold text-slate-900 dark:text-white">
                    {activeId === "account"
                      ? "Account settings"
                      : activeId === "payments"
                        ? "Payment methods"
                        : activeId === "notifications"
                          ? "Notification preferences"
                          : "Operator support"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setModalOpen(false)}
                  aria-label="Close settings"
                >
                  Close
                </Button>
              </div>

              {activeId === "account" ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-300/70 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-white/45">
                      Identity
                    </p>
                    <p className="mt-2 text-sm text-slate-700 dark:text-white/75">{displayName}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-white/60">
                      {user?.phone ? `Phone ${user.phone}` : null}
                      {user?.phone && email ? " · " : null}
                      {email ? `Email ${email}` : null}
                      {!user?.phone && !email ? loginId : null}
                    </p>
                    <div className="mt-4 rounded-2xl border border-slate-300/70 bg-white p-3 dark:border-white/10 dark:bg-white/5">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-white/45">
                        Profile photo
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="relative h-14 w-14 overflow-hidden rounded-full bg-[#163b34]">
                          {avatarPreview ? (
                            <img
                              src={avatarPreview}
                              alt="Selected profile avatar"
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : user?.avatar && !avatarLoadFailed ? (
                            <img
                              src={user.avatar}
                              alt="Profile avatar"
                              className="h-full w-full rounded-full object-cover"
                              onError={() => setAvatarLoadFailed(true)}
                            />
                          ) : (
                            <CircleUserRound className="absolute inset-0 m-auto h-7 w-7 text-[#8df6ba]" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800 dark:text-white/80">
                            Upload a photo
                          </p>
                          <p className="mt-1 text-sm text-slate-600 dark:text-white/60">
                            Optional. Used wherever your profile appears.
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <label className="cursor-pointer rounded-xl border border-slate-300/70 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/80">
                              Choose file
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => onAvatarSelected(e.target.files?.[0] ?? null)}
                                disabled={avatarSaving}
                              />
                            </label>
                            <Button
                              size="sm"
                              disabled={!avatarFile || avatarSaving}
                              onClick={async () => {
                                if (!avatarFile) return;
                                try {
                                  setAvatarSaving(true);
                                  const updated = await uploadAvatar(avatarFile);
                                  patchUser({ avatar: updated.avatar ?? null });
                                  toast.success("Profile photo updated.");
                                  setAvatarFile(null);
                                  setAvatarPreview(null);
                                } catch {
                                  toast.error("Could not upload photo. Try a different image.");
                                } finally {
                                  setAvatarSaving(false);
                                }
                              }}
                            >
                              {avatarSaving ? "Saving..." : "Save photo"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button size="sm" onClick={() => router.push("/auth/profile")}>
                        Edit identity
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push("/auth/login")}
                      >
                        Change sign-in
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-200/70 bg-amber-50 p-3 dark:border-white/10 dark:bg-amber-50/10">
                    <p className="text-xs uppercase tracking-[0.18em] text-amber-700 dark:text-amber-200/70">
                      Security
                    </p>
                    <p className="mt-2 text-sm text-amber-900 dark:text-amber-100/85">
                      Password reset from the app is coming soon. Contact support if you are locked out.
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-3"
                      onClick={() => toast.info("Self-serve password reset is coming soon.")}
                    >
                      Learn more
                    </Button>
                  </div>
                </div>
              ) : null}

              {activeId === "payments" ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-white/60">
                    Coming soon — add/remove cards and wallet funding sources.
                  </p>
                  <div className="rounded-2xl border border-dashed border-slate-300/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-sm font-medium text-slate-800 dark:text-white/80">No billing setup yet</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-white/60">
                      This will enable in-app payments once jobs and receipts are fully enabled.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => toast.info("Payment methods are coming soon.")}
                    >
                      Add payment method
                    </Button>
                  </div>
                </div>
              ) : null}

              {activeId === "notifications" ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-white/60">
                    Choose what alerts you receive. (Demo UI — backend wiring coming soon.)
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-2xl border border-slate-300/70 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/5">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white/80">Push notifications</p>
                        <p className="text-sm text-slate-600 dark:text-white/60">Matching, job updates, safety nudges.</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => toast.info("Push preferences coming soon.")}>
                        Configure
                      </Button>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-slate-300/70 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/5">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white/80">SMS alerts</p>
                        <p className="text-sm text-slate-600 dark:text-white/60">OTP and critical job notifications.</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => toast.info("SMS preferences coming soon.")}>
                        Configure
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              {activeId === "support" ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-white/60">
                    Need help coordinating a job or safety escalation? We’ll route you to the right team.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-dashed border-slate-300/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                      <p className="text-sm font-medium text-slate-800 dark:text-white/80">Live dispatch assistance</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-white/60">
                        Coming soon: guided steps + estimated response times.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3"
                        onClick={() => toast.info("Operator support UI coming soon.")}
                      >
                        Open support
                      </Button>
                    </div>
                    <div className="rounded-2xl border border-dashed border-slate-300/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                      <p className="text-sm font-medium text-slate-800 dark:text-white/80">Safety checklist</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-white/60">
                        Coming soon: quick reference for driver safety.
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-3"
                        onClick={() => toast.info("Safety checklist coming soon.")}
                      >
                        View checklist
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </GlassCard>
          </div>
        ) : null}

        <p className="mt-6 text-center text-xs uppercase tracking-[0.16em] text-slate-500/60 dark:text-white/35">
          EtherAssist v2.4.0 · active
        </p>
      </div>
    </div>
  );
}
