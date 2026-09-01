"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ReceiptText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import type { Job } from "@/lib/api-schema";
import { listQuotes, submitQuote } from "@/services/jobs";

/** Two decimal places, positive. Mirrors the backend's validation so the round trip is
 *  only spent on real submissions. */
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

/**
 * The provider's price proposal, before the work is done.
 *
 * Quoting is **optional** — a tow price falls out of per-km × distance and a jump start is a
 * known number. It earns its keep on a repair whose cost nobody can know until they look,
 * where it buys a price the customer agreed to in writing beforehand.
 *
 * A new quote supersedes any outstanding one, so revising after opening the bonnet is a
 * single action rather than a withdraw-then-resubmit dance.
 */
export function ProviderQuotePanel({ job }: { job: Job }) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const quotesQ = useQuery({
    queryKey: ["job-quotes", job.id],
    queryFn: () => listQuotes(job.id),
    staleTime: 10_000,
  });

  const submitMut = useMutation({
    mutationFn: () => submitQuote(job.id, amount.trim(), notes.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-quotes", job.id] });
      qc.invalidateQueries({ queryKey: ["job-detail", job.id] });
      setAmount("");
      setNotes("");
      toast.success("Quote sent to the customer.");
    },
    onError: () => toast.error("Could not send the quote. Try again."),
  });

  // Quoting is legal only while the job is live (backend SPEC-015 REQ-5).
  const canQuote = job.status === "pending_accept" || job.status === "active";
  const quotes = quotesQ.data ?? [];
  const pending = quotes.find((q) => q.status === "pending");
  const accepted = quotes.find((q) => q.status === "accepted");

  if (!canQuote && !accepted) return null;

  return (
    <GlassCard className="border-white/10 bg-[#1f2c3f]/90">
      <div className="flex items-center gap-2 text-white/70">
        <ReceiptText className="h-4 w-4 text-[#00E676]" />
        <p className="text-[11px] uppercase tracking-[0.16em]">Price</p>
      </div>

      {accepted ? (
        <p className="mt-3 text-sm text-white/70">
          Customer accepted{" "}
          <span className="font-semibold text-white">
            {accepted.currency} {accepted.amount}
          </span>
          . Recording a different final amount is allowed — the customer will see the
          difference before they confirm.
        </p>
      ) : pending ? (
        <p className="mt-3 text-sm text-white/70">
          Waiting on the customer to answer{" "}
          <span className="font-semibold text-white">
            {pending.currency} {pending.amount}
          </span>
          . Sending a new quote replaces it.
        </p>
      ) : (
        <p className="mt-3 text-sm text-white/60">
          Optional. Worth doing when the customer should agree a price before you start.
        </p>
      )}

      {canQuote ? (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.16em] text-white/45">
              {pending ? "Revised quote (GHS)" : "Quote (GHS)"}
            </span>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="200.00"
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#1b2739]/60 px-3 py-2 text-sm text-white/90 outline-none focus:border-white/35"
            />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.16em] text-white/45">
              What it covers
            </span>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Alternator replacement, parts included"
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#1b2739]/60 px-3 py-2 text-sm text-white/90 outline-none focus:border-white/35"
            />
          </label>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={submitMut.isPending}
            onClick={() => {
              const value = amount.trim();
              if (!AMOUNT_PATTERN.test(value) || Number(value) <= 0) {
                toast.error("Enter a price, e.g. 200.00");
                return;
              }
              submitMut.mutate();
            }}
          >
            {pending ? "Send revised quote" : "Send quote"}
          </Button>
        </div>
      ) : null}
    </GlassCard>
  );
}
