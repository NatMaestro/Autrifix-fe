import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

const REQUESTS = [
  {
    name: "Marcus Sterling",
    city: "San Francisco, CA",
    quote: "15 years experience in German performance vehicles and electric drivetrains.",
    tags: ["Diagnostics", "EV Specialist", "Transmission"],
    status: "Background clear",
  },
  {
    name: "Elena Rodriguez",
    city: "Austin, TX",
    quote: "Specializing in brake systems and suspension tuning for luxury SUVs.",
    tags: ["Brakes", "Suspension", "Hybrid Gear"],
    status: "Background pending",
  },
];

export default function AdminVerificationsPage() {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-sora text-6xl font-semibold text-white">Mechanic Verification</h1>
          <p className="mt-1 text-lg text-white/60">
            Reviewing pending professional service applications
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-[#253247]/85 p-1 text-sm">
          <button className="rounded-full bg-white/10 px-4 py-2 text-white/85">All Requests</button>
          <button className="rounded-full bg-[#1f5a49] px-4 py-2 text-[#8ef7bb]">Priority Review</button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {REQUESTS.map((r) => (
          <GlassCard key={r.name} className="border-white/10 bg-[#253247]/90">
            <div className="flex gap-3">
              <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-[#49607a] to-[#1e2f44]" />
              <div>
                <p className="font-sora text-5xl text-white">{r.name}</p>
                <p className="text-sm text-white/60">“{r.quote}”</p>
                <p className="mt-2 text-sm text-white/70">{r.city}</p>
                <p className={r.status.includes("clear") ? "text-[#8ef7bb]" : "text-[#f0ce87]"}>{r.status}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {r.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white/10 px-2 py-1 text-[10px] uppercase text-white/70">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="h-24 rounded-xl bg-[#1d2b3d]" />
              <div className="h-24 rounded-xl bg-[#1d2b3d]" />
              <div className="h-24 rounded-xl bg-[#1d2b3d]" />
            </div>
            <div className="mt-4 flex gap-2">
              <Button className="flex-1">Approve Application</Button>
              <Button variant="ghost" className="flex-1">
                Request More Info
              </Button>
              <Button variant="danger" className="!px-3">
                ⊘
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="mt-4 border-white/10 bg-[#203046]/90">
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-white/45">Pending</p>
            <p className="font-sora text-5xl text-white">12</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-white/45">Approved Today</p>
            <p className="font-sora text-5xl text-[#8ef7bb]">45</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-white/45">Avg Time</p>
            <p className="font-sora text-5xl text-white">2.4h</p>
          </div>
          <div className="justify-self-end">
            <Button variant="ghost">Export Registry</Button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
