"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  Clock3,
  House,
  Navigation,
  MessageSquare,
  Radio,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useRealtimeStore } from "@/store/realtime-store";

const links = [
  { href: "/driver", label: "Home", icon: House },
  { href: "/driver/messages", label: "Messages", icon: MessageSquare },
  { href: "/driver/completed", label: "History", icon: Clock3 },
  { href: "/driver/profile", label: "Profile", icon: UserRound },
];

export function DriverNav() {
  const path = usePathname();
  const router = useRouter();
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const activeJobPath = useRealtimeStore((s) => s.activeJobPath);
  const activeJobLabel = useRealtimeStore((s) => s.activeJobLabel);
  const pushEvent = useRealtimeStore((s) => s.pushEvent);
  const setStatus = useRealtimeStore((s) => s.setStatus);
  const initials = user?.first_name?.trim()
    ? `${user.first_name[0]}${user.last_name?.[0] ?? ""}`.toUpperCase()
    : "U";

  useEffect(() => {
    function onDocumentPointerDown(event: PointerEvent) {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileMenuOpen(false);
    }
    document.addEventListener("pointerdown", onDocumentPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", onDocumentPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  useEffect(() => {
    setProfileMenuOpen(false);
  }, [path]);

  return (
    <>
      <div className="fixed inset-x-4 top-4 z-50 hidden items-center justify-end gap-2 md:flex">
        {activeJobPath ? (
          <Link
            href={activeJobPath}
            className="inline-flex items-center gap-1 rounded-2xl border border-[#00E676]/30 bg-[#00E676]/15 px-3 py-2 text-xs font-semibold text-[#8ef7bb]"
          >
            <Navigation className="h-3.5 w-3.5" />
            Live Job
          </Link>
        ) : null}
        <div className="flex items-center gap-1 rounded-2xl border border-slate-300/70 bg-white/85 p-1 backdrop-blur-xl dark:border-white/10 dark:bg-[#0B1F3A]/85">
          <Link
            href="/driver"
            className={cn(
              "rounded-xl px-3 py-2 text-xs font-medium",
              path === "/driver"
                ? "bg-[#1f5a49] text-[#8ef7bb]"
                : "text-slate-700 dark:text-white/70",
            )}
          >
            Home
          </Link>
          <Link
            href="/driver/providers"
            className={cn(
              "rounded-xl px-3 py-2 text-xs font-medium",
              path.startsWith("/driver/providers")
                ? "bg-[#1f5a49] text-[#8ef7bb]"
                : "text-slate-700 dark:text-white/70",
            )}
          >
            Services
          </Link>
          <Link
            href="/driver/vehicles"
            className={cn(
              "rounded-xl px-3 py-2 text-xs font-medium",
              path.startsWith("/driver/vehicles")
                ? "bg-[#1f5a49] text-[#8ef7bb]"
                : "text-slate-700 dark:text-white/70",
            )}
          >
            Vehicles
          </Link>
        </div>

        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setProfileMenuOpen((v) => !v)}
            aria-expanded={profileMenuOpen}
            aria-haspopup="menu"
            className="flex cursor-pointer list-none items-center gap-2 rounded-2xl border border-slate-300/70 bg-white/85 px-2 py-1.5 text-slate-900 backdrop-blur-xl dark:border-white/10 dark:bg-[#0B1F3A]/85 dark:text-white"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1f5a49] text-xs font-semibold text-[#8ef7bb]">
              {initials}
            </span>
            <span className="text-xs font-medium">{user?.first_name?.trim() || "Profile"}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-slate-500 transition dark:text-white/60",
                profileMenuOpen ? "rotate-180" : "",
              )}
            />
          </button>
          {profileMenuOpen ? (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-300/70 bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#15243c]/95"
            >
            <Link onClick={() => setProfileMenuOpen(false)} href="/driver/profile" className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-white/80 dark:hover:bg-white/10">
              Profile
            </Link>
            <Link onClick={() => setProfileMenuOpen(false)} href="/driver/messages" className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-white/80 dark:hover:bg-white/10">
              Messages
            </Link>
            <Link onClick={() => setProfileMenuOpen(false)} href="/driver/completed" className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-white/80 dark:hover:bg-white/10">
              History
            </Link>
            {activeJobPath ? (
              <Link onClick={() => setProfileMenuOpen(false)} href={activeJobPath} className="block rounded-xl px-3 py-2 text-sm text-[#8ef7bb] hover:bg-white/10">
                {activeJobLabel ?? "Live job"}
              </Link>
            ) : null}
            <Link onClick={() => setProfileMenuOpen(false)} href="/driver/vehicles" className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-white/80 dark:hover:bg-white/10">
              Vehicles
            </Link>
            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen(false);
                logout();
                router.replace("/auth/phone");
              }}
              className="mt-1 block w-full rounded-xl px-3 py-2 text-left text-sm text-red-200 hover:bg-red-500/15"
            >
              Logout
            </button>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="relative rounded-2xl border border-slate-300/70 bg-white/85 p-2 text-slate-700 backdrop-blur-md dark:border-white/10 dark:bg-[#0B1F3A]/85 dark:text-white"
          aria-label="Notifications"
          onClick={() => {
            setStatus("live");
            pushEvent("notification:demo");
          }}
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#00E676]" />
        </button>
        <div className="flex items-center gap-1 rounded-2xl border border-[#00E676]/30 bg-[#00E676]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#00E676]">
          <Radio className="h-3 w-3" /> mesh
        </div>
        <ThemeToggle />
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-300/70 bg-white/90 pb-4 pt-2 backdrop-blur-xl dark:border-white/10 dark:bg-[#0B1F3A]/85 md:hidden">
        {activeJobPath ? (
          <div className="mx-auto mb-2 max-w-lg px-3">
            <Link
              href={activeJobPath}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#00E676]/30 bg-[#00E676]/15 px-3 py-2 text-xs font-semibold text-[#8ef7bb]"
            >
              <Navigation className="h-3.5 w-3.5" />
              {activeJobLabel ?? "Resume live job"}
            </Link>
          </div>
        ) : null}
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-2">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/driver"
                ? path === "/driver"
                : href.includes("/chat")
                  ? path.startsWith("/driver/chat")
                  : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex min-w-[4rem] flex-col items-center gap-1 rounded-xl px-2 py-1 text-[10px] font-medium transition-colors",
                  active ? "text-[#00E676]" : "text-slate-500 hover:text-slate-800 dark:text-white/50 dark:hover:text-white/80",
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
