import { ShieldCheck } from "lucide-react";
import Link from "next/link";

import { AutrifixLogo } from "@/components/brand/autrifix-logo";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute left-1/2 top-[15%] h-64 w-64 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute bottom-[10%] left-[15%] h-48 w-48 rounded-full bg-[#00E676]/15 blur-3xl" />
      <section className="relative w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#111c30]/80 px-6 py-8 text-center shadow-[0_40px_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-white/20 to-white/5">
          <ShieldCheck className="h-7 w-7 text-[#00E676]" />
        </div>
        <div className="mx-auto mb-3 flex max-w-fit items-center gap-2 rounded-xl border border-white/10 bg-[#1b263a]/90 px-3 py-2 text-left">
          <AutrifixLogo size="sm" />
          <span className="text-[10px] uppercase tracking-[0.24em] text-[#9fb3d8]">
            Active Protection
          </span>
        </div>
        <h1 className="font-sora text-3xl font-semibold text-white">AutriFix</h1>
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[#00E676]" />
        <h2 className="mt-12 font-sora text-3xl font-semibold leading-tight text-white md:text-4xl">
          Your Digital Roadside Concierge
        </h2>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-white/65 md:text-base">
          Premium vehicle assistance, maintenance, and emergency services at your fingertips.
        </p>
        <Link href="/auth/login" className="mt-12 block">
          <Button size="lg" className="w-full text-base">
            Continue
          </Button>
        </Link>
        <div className="mt-6 flex items-center justify-center gap-5 text-[10px] uppercase tracking-[0.2em] text-white/35">
          <span>v2.4.0 platinum</span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00E676]" />
            System online
          </span>
        </div>
      </section>
    </main>
  );
}
