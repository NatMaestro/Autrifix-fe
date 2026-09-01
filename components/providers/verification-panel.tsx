"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Clock, ShieldAlert, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import {
  getVerificationStatus,
  levelLabel,
  requirementLabel,
  submitVerification,
} from "@/services/verification";

const MAX_BYTES = 5 * 1024 * 1024; // matches the backend's MAX_IMAGE_BYTES

type FileKey = "idDocument" | "selfie" | "workshopPhoto";

const FILE_FIELDS: { key: FileKey; label: string; hint: string }[] = [
  { key: "idDocument", label: "ID document", hint: "Ghana Card, passport, or driver's licence" },
  { key: "selfie", label: "Photo of you", hint: "Clear, face visible, holding your ID" },
  { key: "workshopPhoto", label: "Workshop or vehicle", hint: "Where you work, or your tow truck" },
];

/**
 * Provider verification: where you stand, and how to move up.
 *
 * Until this existed, a provider blocked below `PROVIDER_MIN_ACCEPT_LEVEL` had no way to
 * submit anything — the endpoint was complete and unreachable, so the gate that protects
 * customers also permanently locked out every provider it stopped.
 *
 * The panel leads with what verification *unlocks* rather than what is missing. That is the
 * design intent of letting unverified providers browse at all (backend ADR-019).
 */
export function VerificationPanel() {
  const qc = useQueryClient();
  const [files, setFiles] = useState<Partial<Record<FileKey, File>>>({});

  const statusQ = useQuery({
    queryKey: ["verification-status"],
    queryFn: getVerificationStatus,
    staleTime: 30_000,
  });

  const submitMut = useMutation({
    mutationFn: () =>
      submitVerification({
        idDocument: files.idDocument as File,
        selfie: files.selfie as File,
        workshopPhoto: files.workshopPhoto as File,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["verification-status"] });
      setFiles({});
      toast.success("Documents submitted for review.");
    },
    onError: (error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      toast.error(
        status === 409
          ? "You already have a submission awaiting review."
          : "Could not submit. Check the files and try again.",
      );
    },
  });

  const status = statusQ.data;
  if (statusQ.isLoading || !status) {
    return (
      <GlassCard className="border-white/10 bg-[#1f2c3f]/90">
        <p className="text-sm text-white/50">Loading verification status…</p>
      </GlassCard>
    );
  }

  const pending = status.submission?.status === "pending";
  const rejected = status.submission?.status === "rejected";
  const allFilesChosen = FILE_FIELDS.every((f) => files[f.key]);

  return (
    <GlassCard className="border-white/10 bg-[#1f2c3f]/90">
      <div className="flex items-center gap-2 text-white/70">
        {status.can_accept_jobs ? (
          <BadgeCheck className="h-4 w-4 text-[#00E676]" />
        ) : (
          <ShieldAlert className="h-4 w-4 text-amber-400" />
        )}
        <p className="text-[11px] uppercase tracking-[0.16em]">Verification</p>
      </div>

      <p className="mt-3 font-sora text-2xl font-semibold text-white">
        {levelLabel(status.verification_level)}
      </p>

      {/* Lead with what is unlocked or locked, not with the level name. */}
      <ul className="mt-3 space-y-1 text-sm">
        <li className={status.can_accept_jobs ? "text-white/70" : "text-amber-200"}>
          {status.can_accept_jobs
            ? "You can accept jobs."
            : `You cannot accept jobs yet — ${levelLabel(status.accept_requires_level)} is required.`}
        </li>
        <li className={status.exact_location_unlocked ? "text-white/70" : "text-white/50"}>
          {status.exact_location_unlocked
            ? "You see customers' exact locations."
            : "Customer locations are shown approximately until you verify."}
        </li>
      </ul>

      {status.missing_requirements.length > 0 ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-[#1b2739]/60 p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
            Finish your profile first
          </p>
          <ul className="mt-2 space-y-1">
            {status.missing_requirements.map((key) => (
              <li key={key} className="text-sm text-white/70">
                • {requirementLabel(key)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {pending ? (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/10 bg-[#1b2739]/60 p-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-white/50" />
          <p className="text-sm text-white/70">
            Your documents are with a reviewer. You will be notified when there is a decision.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {rejected && status.submission?.review_notes ? (
            <div className="rounded-xl border border-red-400/40 bg-red-400/10 p-3">
              <p className="text-sm text-red-100">
                Previous submission was declined: {status.submission.review_notes}
              </p>
            </div>
          ) : null}

          {FILE_FIELDS.map(({ key, label, hint }) => (
            <label key={key} className="block">
              <span className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                {label}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > MAX_BYTES) {
                    toast.error(`${label} must be under 5 MB.`);
                    e.target.value = "";
                    return;
                  }
                  setFiles((prev) => ({ ...prev, [key]: file }));
                }}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#1b2739]/60 px-3 py-2 text-sm text-white/80 file:mr-3 file:rounded file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-white/80"
              />
              <span className="mt-1 block text-xs text-white/40">{hint}</span>
            </label>
          ))}

          <p className="text-xs text-white/40">
            Your documents are deleted once a decision is made — they are not kept on the
            platform.
          </p>

          <Button
            type="button"
            className="w-full gap-2"
            disabled={!allFilesChosen || submitMut.isPending}
            onClick={() => submitMut.mutate()}
          >
            <Upload className="h-4 w-4" />
            {submitMut.isPending ? "Submitting…" : "Submit for review"}
          </Button>
        </div>
      )}
    </GlassCard>
  );
}
