import { GlassCard } from "@/components/ui/glass-card";

export default function AdminHistoryPage() {
  return (
    <div>
      <h1 className="font-sora text-5xl text-white">Job History</h1>
      <p className="mt-1 text-white/60">System-level historical dispatch and execution logs.</p>
      <GlassCard className="mt-5 border-white/10 bg-[#253247]/90">
        <p className="text-white/75">History view placeholder for next iteration.</p>
      </GlassCard>
    </div>
  );
}
