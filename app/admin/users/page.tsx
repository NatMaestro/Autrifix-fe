"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { GlassCard } from "@/components/ui/glass-card";
import { listUsers } from "@/services/administration";
import { levelLabel } from "@/services/verification";

/**
 * User search.
 *
 * Read-only. Editing a user is still Django admin's job: an operator surface that could
 * mutate accounts would need the scoped operator roles that do not exist yet
 * (SPEC-012 OQ-012-B), and inventing them here would bake in a permission model nobody has
 * chosen.
 */
export default function AdminUsersPage() {
  const [term, setTerm] = useState("");
  const [role, setRole] = useState<"" | "customer" | "provider" | "admin">("");

  const usersQ = useQuery({
    queryKey: ["admin-users", term, role],
    queryFn: () => listUsers({ q: term || undefined, role: role || undefined }),
    staleTime: 15_000,
  });

  const users = usersQ.data ?? [];

  return (
    <div>
      <h1 className="font-sora text-6xl font-semibold text-white">User Management</h1>
      <p className="mt-1 text-white/55">Read-only. Use Django admin to change an account.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search by name, email or phone..."
          className="min-w-[240px] flex-1 rounded-xl border border-white/15 bg-[#1b2739]/60 px-3 py-2 text-sm text-white/90 outline-none focus:border-white/35"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as typeof role)}
          className="rounded-xl border border-white/15 bg-[#1b2739]/60 px-3 py-2 text-sm text-white/90"
        >
          <option value="">All roles</option>
          <option value="customer">Customers</option>
          <option value="provider">Providers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {usersQ.isLoading ? (
        <p className="mt-6 text-sm text-white/50">Loading…</p>
      ) : users.length === 0 ? (
        <GlassCard className="mt-6 border-white/10 bg-[#1f2c3f]/90">
          <p className="text-white/60">No users match that search.</p>
        </GlassCard>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.16em] text-white/40">
                <th className="pb-2">Name</th>
                <th className="pb-2">Contact</th>
                <th className="pb-2">Role</th>
                <th className="pb-2">Verification</th>
                <th className="pb-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-white/5">
                  <td className="py-3 text-white/90">
                    {`${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "—"}
                    {!user.is_active ? (
                      <span className="ml-2 rounded bg-red-400/15 px-1.5 py-0.5 text-[10px] uppercase text-red-200">
                        inactive
                      </span>
                    ) : null}
                  </td>
                  <td className="py-3 text-white/60">
                    <div>{user.email || "—"}</div>
                    <div className="text-white/40">{user.phone || "—"}</div>
                  </td>
                  <td className="py-3 capitalize text-white/70">{user.role}</td>
                  <td className="py-3 text-white/60">
                    {user.provider_verification_level
                      ? levelLabel(user.provider_verification_level)
                      : "—"}
                  </td>
                  <td className="py-3 text-white/50">
                    {new Date(user.date_joined).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
