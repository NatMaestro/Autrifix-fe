"use client";

import { Check, Download, Star } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { useRealtimeStore } from "@/store/realtime-store";

export default function CompletedPage() {
  const clearActiveJob = useRealtimeStore((s) => s.clearActiveJob);

  useEffect(() => {
    clearActiveJob();
  }, [clearActiveJob]);

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 pb-28 pt-8">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#174634] text-[#87f9b7]">
            <Check className="h-10 w-10" />
          </span>
          <h1 className="mt-4 font-sora text-6xl font-semibold text-white">Service completed</h1>
          <p className="mt-1 text-white/60">Job ID: #AX-9920-K</p>
        </div>
        <GlassCard className="border-white/10 bg-[#273246]/90">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#8deab8]">Service type</p>
              <p className="font-sora text-4xl font-semibold text-white">Tire change</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Completed on</p>
              <p className="text-xl text-white">Oct 24, 2023</p>
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-[#1e2c3d] p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Kinetic operator</p>
                <p className="font-semibold text-white">Marcus Thorne</p>
              </div>
              <p className="inline-flex items-center gap-1 font-semibold text-[#8bfdbb]">
                <Star className="h-4 w-4 fill-current" /> 4.9
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-white/80">
            <p className="flex justify-between">
              <span>Standard roadside assist</span>
              <span>$85.00</span>
            </p>
            <p className="flex justify-between">
              <span>On-site tire replacement</span>
              <span>$120.00</span>
            </p>
            <p className="flex justify-between">
              <span>Tech service fee</span>
              <span>$14.50</span>
            </p>
          </div>
          <div className="mt-4 rounded-2xl bg-[#1d4c42]/85 p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">Total cost paid</p>
            <p className="font-sora text-6xl font-semibold text-[#91f9be]">$219.50</p>
            <p className="text-right text-xs text-white/55">Visa • 4482</p>
          </div>
        </GlassCard>
        <Link href="/driver/rate" className="mt-6 block">
          <Button className="w-full" size="lg">
            Proceed to rating
          </Button>
        </Link>
        <button
          type="button"
          className="mx-auto mt-4 flex items-center gap-2 text-sm text-white/65 hover:text-white"
        >
          <Download className="h-4 w-4" /> Save digital invoice
        </button>
      </div>
    </div>
  );
}
