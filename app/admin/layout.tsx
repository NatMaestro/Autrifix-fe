"use client";

import {
  Bell,
  Gauge,
  History,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  UsersRound,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { SidebarNavList } from "@/components/layout/sidebar-nav-list";
import { IconActionButton } from "@/components/layout/icon-action-button";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard", Icon: Gauge },
  { href: "/admin/users", label: "Users", Icon: UsersRound },
  { href: "/admin/verifications", label: "Verifications", Icon: ShieldCheck },
  { href: "/admin/history", label: "Job History", Icon: History },
  { href: "/admin/status", label: "System Status", Icon: Wrench },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-slate-300/70 bg-white/85 p-6 lg:flex lg:flex-col dark:border-white/10 dark:bg-[#111b2b]/95">
        <p className="font-sora text-3xl font-semibold text-slate-900 dark:text-white">AutriFix Admin</p>
        <div className="mt-6 rounded-2xl border border-slate-300/70 bg-white/90 p-4 dark:border-white/10 dark:bg-[#1b273a]/90">
          <p className="text-lg font-semibold text-[#8ef7bb]">System Admin</p>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-white/45">Super user</p>
        </div>
        <div className="mt-4">
          <SidebarNavList
            items={NAV_LINKS}
            pathname={pathname}
            rootHref="/admin"
            activeClassName="bg-[#184739]/70 text-[#8ef7bb]"
          />
        </div>
        <Button className="mt-auto w-full">Broadcast Alert</Button>
        <div className="mt-3 space-y-2">
          <button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-slate-100 dark:text-white/65 dark:hover:bg-white/5">
            <Settings className="h-4 w-4" /> Support
          </button>
          <button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[#f0b5b8] hover:bg-red-500/10">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      <main className="min-h-dvh">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-300/70 bg-white/85 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1628]/85">
          <p className="font-sora text-2xl font-semibold text-slate-900 dark:text-white lg:hidden">Admin</p>
          <label className="hidden max-w-md flex-1 items-center gap-2 rounded-xl border border-slate-300/70 bg-white/85 px-3 py-2 text-sm text-slate-600 dark:border-white/10 dark:bg-[#121f35]/85 dark:text-white/60 lg:inline-flex">
            <Search className="h-4 w-4" />
            <input
              placeholder="Search system entities..."
              className="w-full bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-white/35"
            />
          </label>
          <div className="flex items-center gap-2">
            <IconActionButton Icon={Bell} label="Notifications" />
            <IconActionButton Icon={Settings} label="Settings" />
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#204359] text-sm text-white">
              A
            </span>
          </div>
        </header>
        <div className="px-4 py-6">{children}</div>
      </main>
    </div>
  );
}
