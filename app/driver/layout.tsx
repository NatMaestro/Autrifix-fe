"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { DriverNav } from "@/features/driver/components/driver-nav";
import { useAuthStore } from "@/store/auth-store";

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useAuthStore((s) => s.hydrated);
  const access = useAuthStore((s) => s.access);
  const user = useAuthStore((s) => s.user);
  const isDriverHome = pathname === "/driver";
  const isDriverChat = pathname.startsWith("/driver/chat");

  useEffect(() => {
    if (!hydrated) return;
    if (!access) {
      router.replace("/auth/login");
      return;
    }
    if (user?.role === "mechanic") {
      router.replace("/mechanic");
    }
  }, [hydrated, access, user, router]);

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

  if (user.role !== "driver") {
    return (
      <div className="flex min-h-dvh items-center justify-center text-slate-600 dark:text-white/60">
        Redirecting…
      </div>
    );
  }

  return (
    <div
      className={`${isDriverChat ? "h-dvh overflow-hidden pb-0" : `min-h-dvh ${isDriverHome ? "pb-0" : "pb-24"}`}`}
    >
      {children}
      {!isDriverChat ? <DriverNav /> : null}
    </div>
  );
}
