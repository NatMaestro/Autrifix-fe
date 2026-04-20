"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export type SidebarNavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
};

type Props = {
  items: readonly SidebarNavItem[];
  pathname: string;
  rootHref?: string;
  activeClassName?: string;
  inactiveClassName?: string;
};

export function SidebarNavList({
  items,
  pathname,
  rootHref,
  activeClassName = "border border-emerald-300/80 bg-emerald-100 text-emerald-700 dark:border-emerald-300/30 dark:bg-white/10 dark:text-[#8df6ba]",
  inactiveClassName = "border border-transparent text-slate-600 hover:border-slate-300/70 hover:bg-slate-100 hover:text-slate-900 dark:text-white/65 dark:hover:border-white/10 dark:hover:bg-white/5 dark:hover:text-white",
}: Props) {
  return (
    <div className="space-y-2">
      {items.map(({ href, label, Icon }) => {
        const isRoot = rootHref ? href === rootHref : false;
        const active = isRoot ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors",
              active ? activeClassName : inactiveClassName,
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
