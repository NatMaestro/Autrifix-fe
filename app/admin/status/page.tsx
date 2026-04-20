import { GlassCard } from "@/components/ui/glass-card";

export default function AdminSystemStatusPage() {
  return (
    <div>
      <h1 className="font-sora text-5xl text-white">System Status</h1>
      <p className="mt-1 text-white/60">Live health checks, queues, and dependent services.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <GlassCard className="border-white/10 bg-[#253247]/90">
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">API Gateway</p>
          <p className="mt-2 text-[#8ef7bb]">Operational</p>
        </GlassCard>
        <GlassCard className="border-white/10 bg-[#253247]/90">
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Dispatch Queue</p>
          <p className="mt-2 text-[#8ef7bb]">Nominal</p>
        </GlassCard>
        <GlassCard className="border-white/10 bg-[#253247]/90">
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Payments</p>
          <p className="mt-2 text-[#f0ce87]">Degraded</p>
        </GlassCard>
      </div>
    </div>
  );
}
