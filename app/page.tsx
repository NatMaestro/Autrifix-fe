import Link from "next/link";

import { AutrifixLogo } from "@/components/brand/autrifix-logo";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="relative flex min-h-dvh flex-col px-4 pb-12 pt-10">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
        <AutrifixLogo size="md" />
        <div className="flex items-center gap-2">
          <Link href="/auth/phone">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/auth/phone">
            <Button size="sm">Get the app</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto mt-16 flex w-full max-w-5xl flex-1 flex-col justify-center gap-12 lg:flex-row lg:items-center">
        <div className="max-w-xl flex-1 space-y-6">
          <p className="font-sora text-xs font-semibold uppercase tracking-[0.35em] text-[#00E676]">
            Live dispatch · Accra-ready
          </p>
          <h1 className="font-sora text-4xl font-semibold leading-tight text-balance text-white md:text-5xl lg:text-6xl">
            Roadside help that moves{" "}
            <span className="bg-gradient-to-r from-[#00E676] to-cyan-300 bg-clip-text text-transparent">
              at the speed of now
            </span>
            .
          </h1>
          <p className="text-lg text-white/70">
            Map-first matching for drivers and mechanics. One tap, live route, encrypted
            chat — built like a mobility platform, not a form factory.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/auth/phone">
              <Button size="lg">Start with phone</Button>
            </Link>
            <Link href="/driver">
              <Button variant="outline" size="lg" className="!text-white">
                Preview driver map
              </Button>
            </Link>
          </div>
        </div>

        <GlassCard className="relative flex-1 overflow-hidden border-[#00E676]/20 p-0 lg:max-w-md">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00E676]/10 to-transparent" />
          <div className="relative space-y-4 p-8">
            <div className="flex items-center justify-between text-sm text-white/60">
              <span>Signal mesh</span>
              <span className="rounded-full bg-[#00E676]/20 px-2 py-0.5 text-[10px] text-[#00E676]">
                LIVE
              </span>
            </div>
            <div className="font-mono text-3xl font-light text-white">
              00:14<span className="text-white/40">.82</span>
            </div>
            <p className="text-sm text-white/60">
              Median match time in dense zones (simulated UI — wire to your analytics).
            </p>
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-1 flex-1 overflow-hidden rounded-full bg-white/10"
                >
                  <div
                    className="h-full w-2/3 rounded-full bg-[#00E676]"
                    style={{ animation: `pulse ${1 + i * 0.2}s ease infinite` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </section>
    </main>
  );
}
