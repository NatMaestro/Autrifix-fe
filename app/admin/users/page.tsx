import { Search } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

const USERS = [
  { name: "Marcus Thorne", email: "marcus.l@autrifix.io", role: "MECHANIC", joined: "Oct 12, 2023", status: "Active" },
  { name: "Elena Rodriguez", email: "elena.r@fleet.com", role: "DRIVER", joined: "Nov 03, 2023", status: "Active" },
  { name: "Jasper Davies", email: "j.davies@web.uk", role: "DRIVER", joined: "Jan 15, 2024", status: "Banned" },
  { name: "Samuel Oak", email: "oak.repairs@service.net", role: "MECHANIC", joined: "Feb 22, 2024", status: "Active" },
];

export default function AdminUsersPage() {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-sora text-6xl font-semibold text-white">User Management</h1>
          <p className="mt-1 max-w-3xl text-lg text-white/60">
            Oversee and manage operational status for platform participants.
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-[#253247]/85 p-1 text-sm">
          <button className="rounded-full bg-[#c9d8fd] px-4 py-2 text-[#1c2a40]">All Users</button>
          <button className="px-4 py-2 text-white/65">Drivers</button>
          <button className="px-4 py-2 text-white/65">Mechanics</button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <GlassCard className="border-white/10 bg-[#253247]/90">
          <p className="text-xs uppercase tracking-[0.16em] text-[#8ef7bb]">Active Personnel</p>
          <p className="font-sora text-6xl text-white">1,284</p>
          <p className="text-sm text-[#8ef7bb]">+12% from last month</p>
        </GlassCard>
        <GlassCard className="border-white/10 bg-[#253247]/90">
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Pending Verification</p>
          <p className="font-sora text-6xl text-white">42</p>
          <p className="text-sm text-white/60">Avg. wait: 14 mins</p>
        </GlassCard>
        <GlassCard className="border-white/10 bg-[#253247]/90">
          <p className="text-xs uppercase tracking-[0.16em] text-[#f2b3b2]">Banned Entities</p>
          <p className="font-sora text-6xl text-white">18</p>
          <p className="text-sm text-[#f2b3b2]">Flagged for safety violations</p>
        </GlassCard>
      </div>

      <GlassCard className="mt-5 overflow-hidden border-white/10 bg-[#253247]/90 p-0">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <label className="inline-flex min-w-[320px] items-center gap-2 rounded-xl border border-white/10 bg-[#121f35] px-3 py-2 text-sm text-white/60">
            <Search className="h-4 w-4" />
            <input
              placeholder="Search by name, email or ID..."
              className="w-full bg-transparent outline-none"
            />
          </label>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">Filters</Button>
            <Button variant="ghost" size="sm">Export</Button>
          </div>
        </div>
        <div className="divide-y divide-white/10">
          <div className="grid grid-cols-[1.2fr_160px_160px_160px_80px] gap-3 px-4 py-3 text-xs uppercase tracking-[0.16em] text-white/45">
            <span>User Entity</span>
            <span>Role</span>
            <span>Join Date</span>
            <span>Security Status</span>
            <span>Actions</span>
          </div>
          {USERS.map((u) => (
            <div
              key={u.email}
              className="grid grid-cols-[1.2fr_160px_160px_160px_80px] items-center gap-3 px-4 py-3"
            >
              <div>
                <p className="font-medium text-white">{u.name}</p>
                <p className="text-sm text-white/55">{u.email}</p>
              </div>
              <span className="inline-flex w-fit rounded-full bg-[#1f355b] px-2 py-1 text-xs text-[#9ec8ff]">
                {u.role}
              </span>
              <span className="text-white/70">{u.joined}</span>
              <span className={u.status === "Active" ? "text-[#8ef7bb]" : "text-[#f2b3b2]"}>
                {u.status}
              </span>
              <button className="text-xl text-white/50">⋮</button>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
