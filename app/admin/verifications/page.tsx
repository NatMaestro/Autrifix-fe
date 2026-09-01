"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Clock, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { listVerifications, reviewVerification } from "@/services/administration";
import { levelLabel } from "@/services/verification";

/**
 * The verification queue.
 *
 * This is the operator surface that matters most: verification decides who may attend a
 * stranded customer, and until now it required a Django admin credential over the whole
 * database. The queue is served oldest-first, because newest-first starves whoever has
 * waited longest — which is the complaint verification delays actually generate.
 *
 * The submitted documents are **not** shown here. They are purged on decision and serving
 * identity documents through a JSON API would protect them with nothing but a URL; a
 * reviewer opens them in Django admin. Recorded as SPEC-012 OQ-012-I.
 */
export default function AdminVerificationsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const queueQ = useQuery({
    queryKey: ["admin-verifications", filter],
    queryFn: () => listVerifications({ status: filter }),
    staleTime: 15_000,
  });

  const reviewMut = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      reviewVerification(id, { approve, notes: notes[id] ?? "" }),
    onSuccess: (_data, { approve }) => {
      qc.invalidateQueries({ queryKey: ["admin-verifications"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success(approve ? "Provider verified." : "Submission declined.");
    },
    onError: (error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      const data = (error as { response?: { data?: { notes?: string[] } } })?.response?.data;
      toast.error(
        data?.notes?.[0] ??
          (status === 409 ? "This submission was already reviewed." : "Could not save the review."),
      );
    },
  });

  const rows = queueQ.data ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-sora text-6xl font-semibold text-white">Provider Verification</h1>
          <p className="mt-1 text-white/55">
            Decides who may accept jobs. Documents open in Django admin.
          </p>
        </div>
        <div className="flex gap-2">
          {(["pending", "approved", "rejected"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-xl border px-3 py-1.5 text-sm capitalize transition-colors ${
                filter === value
                  ? "border-[#00E676]/70 bg-[#00E676]/10 text-white"
                  : "border-white/15 bg-white/5 text-white/60 hover:border-white/30"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {queueQ.isLoading ? (
        <p className="mt-6 text-sm text-white/50">Loading queue…</p>
      ) : rows.length === 0 ? (
        <GlassCard className="mt-6 border-white/10 bg-[#1f2c3f]/90">
          <p className="text-white/60">
            {filter === "pending"
              ? "Nothing waiting. Providers appear here when they submit documents."
              : `No ${filter} submissions.`}
          </p>
        </GlassCard>
      ) : (
        <div className="mt-6 space-y-3">
          {rows.map((row) => (
            <GlassCard key={row.id} className="border-white/10 bg-[#1f2c3f]/90">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-sora text-2xl font-semibold text-white">
                    {row.provider_name || "Unnamed provider"}
                  </p>
                  <p className="mt-1 text-sm text-white/55">
                    {row.provider_type} · currently {levelLabel(row.current_level)} · requesting{" "}
                    {levelLabel(row.requested_level)}
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    Submitted {new Date(row.submitted_at).toLocaleString()}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs text-white/60">
                  {row.status === "pending" ? (
                    <Clock className="h-3 w-3" />
                  ) : row.status === "approved" ? (
                    <BadgeCheck className="h-3 w-3 text-[#00E676]" />
                  ) : (
                    <ShieldAlert className="h-3 w-3 text-amber-400" />
                  )}
                  {row.status}
                </span>
              </div>

              {row.status === "pending" ? (
                <div className="mt-4 space-y-2">
                  <input
                    value={notes[row.id] ?? ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [row.id]: e.target.value }))}
                    placeholder="Reason — required when declining, shown to the provider"
                    className="w-full rounded-lg border border-white/15 bg-[#1b2739]/60 px-3 py-2 text-sm text-white/90 outline-none focus:border-white/35"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      disabled={reviewMut.isPending}
                      onClick={() => reviewMut.mutate({ id: row.id, approve: true })}
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={reviewMut.isPending}
                      onClick={() => reviewMut.mutate({ id: row.id, approve: false })}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ) : row.review_notes ? (
                <p className="mt-3 rounded-xl border border-white/10 bg-[#1b2739]/60 px-3 py-2 text-sm text-white/70">
                  {row.review_notes}
                  {row.reviewed_by_label ? (
                    <span className="ml-1 text-white/40">— {row.reviewed_by_label}</span>
                  ) : null}
                </p>
              ) : null}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
