"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { DriverNav } from "@/components/layout/driver-nav";
import { useAuthStore } from "@/store/auth-store";

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const access = useAuthStore((s) => s.access);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!access) {
      router.replace("/auth/phone");
      return;
    }
    if (user?.role === "mechanic") {
      router.replace("/mechanic");
    }
  }, [access, user, router]);

  if (!access || user?.role !== "driver") {
    return (
      <div className="flex min-h-dvh items-center justify-center text-white/60">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-24">
      {children}
      <DriverNav />
    </div>
  );
}
