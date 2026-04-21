"use client";

import { useEffect, useState } from "react";

import { AutrifixLogo } from "@/components/brand/autrifix-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { appHref } from "@/lib/constants";
import { cn } from "@/lib/utils";

const links = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#drivers", label: "Drivers" },
  { href: "#mechanics", label: "Mechanics" },
] as const;

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const appLogin = appHref("/auth/login");
  const appRegister = appHref("/auth/register");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-transparent transition-colors",
        scrolled && "border-white/10 bg-[#0a1220]/85 backdrop-blur-xl",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#" className="flex shrink-0 items-center gap-2 text-white">
          <AutrifixLogo size="sm" />
        </a>
        <nav className="flex max-w-[min(100%,28rem)] flex-wrap items-center justify-end gap-0.5 sm:max-w-none sm:justify-center md:flex-nowrap md:gap-1">
          {links.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="rounded-xl px-2 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white sm:px-3 sm:text-sm"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <a
            href={appRegister}
            className="hidden rounded-xl px-3 py-2 text-sm font-medium text-white/80 hover:text-white sm:inline"
          >
            Sign up
          </a>
          <a
            href={appLogin}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-[#00E676] px-3 py-2 text-sm font-medium text-[#0B1F3A] shadow-[0_0_24px_rgba(0,230,118,0.25)] transition-all hover:bg-[#5efca3] active:scale-[0.98]"
          >
            Open app
          </a>
        </div>
      </div>
    </header>
  );
}
