"use client";

import { Car, MapPinned, MessageCircle, Wrench } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  { href: "/driver", label: "Map", icon: MapPinned },
  { href: "/driver/providers", label: "Nearby", icon: Wrench },
  { href: "/driver/vehicles", label: "Garage", icon: Car },
  { href: "/driver/chat/demo", label: "Chat", icon: MessageCircle },
];

export function DriverNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0B1F3A]/85 pb-4 pt-2 backdrop-blur-xl">
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
                active
                  ? "text-[#00E676]"
                  : "text-white/50 hover:text-white/80",
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
