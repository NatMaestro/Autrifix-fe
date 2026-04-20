import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

const Kpis = [
  { label: "Total Active Users", value: "42,892", meta: "+12%" },
  { label: "Mechanics Online", value: "1,402", meta: "LIVE" },
  { label: "Revenue (MTD)", value: "$1.24M", meta: "USD" },
  { label: "System Health", value: "99.98%", meta: "OK" },
];

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="font-sora text-6xl font-semibold text-white">Systems Overview</h1>
      <p className="mt-1 text-lg text-white/60">
        Real-time performance metrics and operational capacity.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Kpis.map((k) => (
          <GlassCard key={k.label} className="border-white/10 bg-[#253247]/90">
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">{k.meta}</p>
            <p className="mt-2 font-sora text-5xl text-white">{k.value}</p>
            <p className="text-sm text-white/65">{k.label}</p>
          </GlassCard>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_320px]">
        <GlassCard className="border-white/10 bg-[#253247]/90">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-sora text-4xl text-white">Request Volume</p>
              <p className="text-sm text-white/55">Last 24 hours of operational traffic</p>
            </div>
            <p className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/65">DAY</p>
          </div>
          <div className="grid h-64 grid-cols-14 items-end gap-2">
            {[44, 60, 33, 68, 45, 59, 72, 66, 59, 45, 27, 34, 46, 68].map((h, idx) => (
              <div
                key={idx}
                className={`rounded-t-md ${idx === 6 ? "bg-[#77f6a9]" : "bg-[#5f7f71]/70"}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </GlassCard>

        <GlassCard className="border-white/10 bg-[#253247]/90">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-sora text-4xl text-white">Critical Events</p>
            <span className="rounded-full bg-red-500/20 px-2 py-1 text-[10px] text-red-300">3 NEW</span>
          </div>
          <div className="space-y-3 text-sm">
            <p className="text-white/80">Server Node 04 Overload</p>
            <p className="text-white/80">Payment Gateway Restored</p>
            <p className="text-white/80">Batch Verification Complete</p>
          </div>
          <Button variant="ghost" className="mt-6 w-full">
            View all logs
          </Button>
        </GlassCard>
      </div>

      <GlassCard className="mt-4 border-white/10 bg-[#233146]/90 p-0">
        <div className="h-72 rounded-2xl bg-[radial-gradient(ellipse_at_center,_rgba(82,144,255,0.15),_transparent_60%)] p-6">
          <p className="font-sora text-4xl text-white">Global Dispatch</p>
          <p className="text-sm text-white/60">Live mechanic positioning and active request routing</p>
        </div>
      </GlassCard>
    </div>
  );
}
