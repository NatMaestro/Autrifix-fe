"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, ReceiptText, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import type { Job } from "@/lib/api-schema";
import { confirmJob, listQuotes, respondToQuote } from "@/services/jobs";

/**
 * The customer's side of the money conversation: answer a quote, then agree to the amount.
 *
 * Both actions are the customer's alone. A provider proposes and records; only the customer
 * can accept a price or close a job (backend ADR-022). Until this panel existed, the
 * provider-side flow was complete and unreachable — every finished job sat in
 * `awaiting_confirmation` until the backend's timeout closed it *against* the customer.
 */
export function JobMoneyPanel({ job }: { job: Job }) {
  const qc = useQueryClient();

  const quotesQ = useQuery({
    queryKey: ["job-quotes", job.id],
    queryFn: () => listQuotes(job.id),
    // Only worth fetching while a price could still be under discussion.
    enabled: job.status === "pending_accept" || job.status === "active",
    staleTime: 10_000,
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["jobs"] });
    qc.invalidateQueries({ queryKey: ["job-quotes", job.id] });
  }

  const respondMut = useMutation({
    mutationFn: ({ quoteId, accept }: { quoteId: string; accept: boolean }) =>
      respondToQuote(job.id, quoteId, accept),
    onSuccess: (_data, { accept }) => {
      invalidate();
      toast.success(accept ? "Quote accepted." : "Quote declined.");
    },
    onError: () => toast.error("Could not send your answer. Try again."),
  });

  const confirmMut = useMutation({
    mutationFn: () => confirmJob(job.id),
    onSuccess: () => {
      invalidate();
      toast.success("Confirmed. You can now leave a review.");
    },
    onError: () => toast.error("Could not confirm the job. Try again."),
  });

  const pendingQuote = (quotesQ.data ?? []).find((q) => q.status === "pending");

  // --- a price is on the table, work has not finished ------------------------------
  if (pendingQuote) {
    return (
      <GlassCard className="border-white/10 bg-[#1f2c3f]/90">
        <div className="flex items-center gap-2 text-white/70">
          <ReceiptText className="h-4 w-4 text-[#00E676]" />
          <p className="text-[11px] uppercase tracking-[0.16em]">Quote from your provider</p>
        </div>
        <p className="mt-3 font-sora text-3xl font-semibold text-white">
          {pendingQuote.currency} {pendingQuote.amount}
        </p>
        {pendingQuote.notes ? (
          <p className="mt-2 text-sm text-white/60">{pendingQuote.notes}</p>
        ) : null}
        <p className="mt-3 text-xs text-white/45">
          Declining is not a cancellation — your provider can send a revised price.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            type="button"
            className="gap-2"
            disabled={respondMut.isPending}
            onClick={() => respondMut.mutate({ quoteId: pendingQuote.id, accept: true })}
          >
            <Check className="h-4 w-4" /> Accept
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={respondMut.isPending}
            onClick={() => respondMut.mutate({ quoteId: pendingQuote.id, accept: false })}
          >
            <X className="h-4 w-4" /> Decline
          </Button>
        </div>
      </GlassCard>
    );
  }

  // --- work is done, the customer is now the blocker -------------------------------
  if (job.status === "awaiting_confirmation") {
    // Positive means the provider is asking for more than was agreed. The backend
    // deliberately discloses this rather than capping the amount, on the reasoning that a
    // repair can turn up something nobody could have foreseen — so the customer needs the
    // comparison in front of them, not a silent adjustment.
    const variance = job.amount_variance ? Number(job.amount_variance) : 0;
    const overAgreed = variance > 0;

    return (
      <GlassCard className="border-white/10 bg-[#1f2c3f]/90">
        <div className="flex items-center gap-2 text-white/70">
          <ReceiptText className="h-4 w-4 text-[#00E676]" />
          <p className="text-[11px] uppercase tracking-[0.16em]">Confirm the work</p>
        </div>

        <p className="mt-3 font-sora text-3xl font-semibold text-white">
          {job.currency} {job.final_amount}
        </p>
        <p className="mt-1 text-sm text-white/60">
          {job.provider_name} has finished and recorded this amount.
        </p>

        {overAgreed ? (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-sm text-amber-100">
              This is <span className="font-semibold">{job.currency} {variance.toFixed(2)}</span>{" "}
              more than the quote you accepted. Ask your provider about the difference before
              confirming if that is not expected.
            </p>
          </div>
        ) : null}

        <p className="mt-4 text-xs text-white/45">
          Confirming closes the job. You pay your provider directly — Autrifix does not handle
          the payment.
        </p>

        <Button
          type="button"
          className="mt-4 w-full gap-2"
          size="lg"
          disabled={confirmMut.isPending}
          onClick={() => confirmMut.mutate()}
        >
          <Check className="h-4 w-4" />
          {confirmMut.isPending ? "Confirming…" : `Confirm ${job.currency} ${job.final_amount}`}
        </Button>
      </GlassCard>
    );
  }

  return null;
}
