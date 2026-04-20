"use client";

import {
  Bell,
  ChartNoAxesCombined,
  Gauge,
  LifeBuoy,
  LogOut,
  Route,
  Settings,
  UserRound,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AutrifixLogo } from "@/components/brand/autrifix-logo";
import { useAuthStore } from "@/store/auth-store";
import { SidebarNavList } from "@/components/layout/sidebar-nav-list";
import { IconActionButton } from "@/components/layout/icon-action-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

export default function MechanicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useAuthStore((s) => s.hydrated);
  const access = useAuthStore((s) => s.access);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isMechanicChat = pathname.startsWith("/mechanic/chat");
  const [showSupportModal, setShowSupportModal] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!access) {
      router.replace("/auth/login");
    }
  }, [hydrated, access, router]);

  useEffect(() => {
    if (!hydrated) return;
    if (user?.role === "driver") {
      router.replace("/driver");
    }
  }, [hydrated, user, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-slate-600 dark:text-white/60">
        Restoring session…
      </div>
    );
  }

  if (!access) {
    return null;
  }

  if (!user) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-slate-600 dark:text-white/60">
        Loading profile…
      </div>
    );
  }

  if (user.role !== "mechanic") {
    return (
      <div className="flex min-h-dvh items-center justify-center text-slate-600 dark:text-white/60">
        Redirecting…
      </div>
    );
  }

  const nav = [
    { href: "/mechanic", label: "Dashboard", Icon: Gauge },
    { href: "/mechanic/history", label: "Jobs", Icon: Wrench },
    { href: "/mechanic/earnings", label: "Metrics", Icon: ChartNoAxesCombined },
    { href: "/mechanic/profile", label: "Profile", Icon: UserRound },
  ] as const;

  return (
    <div className="h-dvh overflow-hidden lg:grid lg:grid-cols-[220px_1fr]">
      <aside className="hidden h-dvh overflow-y-auto border-r border-slate-300/70 bg-white/85 p-6 lg:flex lg:flex-col dark:border-white/10 dark:bg-[#101a2a]/95">
        <Link href="/mechanic" className="mb-8">
          <AutrifixLogo size="md" />
        </Link>
        <SidebarNavList items={nav} pathname={pathname} rootHref="/mechanic" />
        <div className="mt-auto space-y-3">
          <button
            type="button"
            onClick={() => setShowSupportModal(true)}
            className="w-full rounded-xl border border-slate-300/70 px-3 py-2 text-left text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
          >
            Support
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
              router.replace("/auth/login");
            }}
            className="inline-flex w-full items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-left text-red-200"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>
      <main className="h-dvh overflow-hidden">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-300/70 bg-white/85 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#0B1F3A]/80">
          <Link href="/mechanic" className="lg:hidden">
            <AutrifixLogo size="sm" />
          </Link>
          <p className="hidden text-xs uppercase tracking-[0.18em] text-[#00E676] lg:block">
            Active duty
          </p>
          <div className="flex items-center gap-2">
            <Link href="/mechanic/navigate">
              <IconActionButton
                Icon={Route}
                label="Navigate"
                active={pathname.startsWith("/mechanic/navigate")}
              />
            </Link>
            <IconActionButton Icon={Bell} label="Notifications" />
            <ThemeToggle />
            <Link href="/mechanic/profile">
              <IconActionButton
                Icon={Settings}
                label="Settings"
                active={pathname.startsWith("/mechanic/profile")}
              />
            </Link>
          </div>
        </header>
        <div className={`${isMechanicChat ? "h-[calc(100dvh-61px)] overflow-hidden" : "h-[calc(100dvh-61px)] overflow-y-auto pb-6"}`}>
          {children}
        </div>
      </main>
      {showSupportModal ? (
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowSupportModal(false);
          }}
        >
          <GlassCard className="w-full max-w-xl border-slate-300/70 bg-white/95 p-5 dark:border-white/10 dark:bg-[#1a2437]/95">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-white/45">
                  AutriFix Support
                </p>
                <p className="mt-1 font-sora text-2xl text-slate-900 dark:text-white">Need help?</p>
              </div>
              <LifeBuoy className="h-5 w-5 text-emerald-600 dark:text-[#8df6ba]" />
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-white/60">
              Reach support for urgent dispatch issues, account access, and app troubleshooting.
            </p>
            <div className="mt-4 grid gap-2">
              <a
                href="tel:0202607006"
                className="rounded-xl border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-800 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
              >
                Call support hotline
              </a>
              <a
                href="mailto:nathanielguggisberg@gmail.com?subject=Mechanic%20Support%20Request"
                className="rounded-xl border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-800 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
              >
                Email support
              </a>
              <Link
                href="/mechanic/profile"
                onClick={() => setShowSupportModal(false)}
                className="rounded-xl border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-800 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
              >
                Open alerts & support settings
              </Link>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" onClick={() => setShowSupportModal(false)}>
                Close
              </Button>
            </div>
          </GlassCard>
        </div>
      ) : null}
    </div>
  );
}
