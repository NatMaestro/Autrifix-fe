"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clock3, MapPin, X } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  request?: {
    customerName: string;
    vehicleLabel: string;
    issueTitle: string;
    issueDescription: string;
    distanceLabel: string;
  } | null;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  onSnooze?: () => void;
};

export function IncomingRequestModal({
  open,
  request,
  onClose,
  onAccept,
  onReject,
  onSnooze,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 pb-8 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
            className="w-full max-w-xl"
          >
            <GlassCard className="relative border-[#00E676]/25 bg-white/90 dark:bg-[#263247]/85">
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-white/50 dark:hover:bg-white/10"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#00E676]">
                Incoming request
              </p>
              <h2 className="mt-2 font-sora text-5xl font-semibold text-slate-900 dark:text-white">
                {request?.customerName || "Driver nearby"}
              </h2>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-600 dark:text-white/65">
                <MapPin className="h-4 w-4 text-[#00E676]" />
                {request?.vehicleLabel || "Vehicle details pending"}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-300/70 bg-white p-4 dark:border-white/10 dark:bg-[#1c2b42]">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-white/45">
                    Issue
                  </p>
                  <p className="mt-1 font-sora text-3xl text-slate-900 dark:text-white">
                    {request?.issueTitle || "Roadside issue"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-white/60">
                    {request?.issueDescription || "Driver shared issue details for this request."}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-300/70 bg-white p-4 dark:border-white/10 dark:bg-[#17263a]">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-white/45">
                    Distance
                  </p>
                  <p className="mt-1 font-sora text-3xl text-slate-900 dark:text-white">
                    {request?.distanceLabel || "Nearby"}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button className="flex-1" type="button" onClick={onAccept}>
                  Accept job
                </Button>
              </div>
              <div className="mt-4 flex items-center justify-center gap-8 text-sm text-slate-600 dark:text-white/60">
                <button type="button" onClick={onReject}>
                  Decline
                </button>
                <button type="button" className="inline-flex items-center gap-1" onClick={onSnooze}>
                  <Clock3 className="h-4 w-4" /> Wait 5m
                </button>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
