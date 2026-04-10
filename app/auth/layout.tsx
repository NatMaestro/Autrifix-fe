import Link from "next/link";

import { AutrifixLogo } from "@/components/brand/autrifix-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col px-4 py-6">
      <header className="mx-auto flex w-full max-w-md items-center justify-between">
        <Link href="/">
          <AutrifixLogo size="sm" />
        </Link>
        <ThemeToggle />
      </header>
      <div className="flex flex-1 flex-col items-center justify-center py-8">
        {children}
      </div>
    </div>
  );
}
