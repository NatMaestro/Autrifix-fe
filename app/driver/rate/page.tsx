"use client";

import { CheckCircle2, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function RatePage() {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [tags, setTags] = useState<string[]>(["Prompt arrival"]);

  function submit() {
    if (stars < 1) {
      toast.error("Pick a star rating.");
      return;
    }
    toast.success("Thanks — review queued (POST /reviews/).");
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 pb-28 pt-8">
      <GlassCard className="mb-4 w-full max-w-2xl border-white/10 bg-[#1f2c3f]/90">
        <div className="flex items-center gap-3">
          <span className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#355a66] to-[#1d2d42]" />
          <div>
            <p className="font-sora text-2xl font-semibold text-white">Marcus Sterling</p>
            <p className="text-sm text-white/60">Roadside Assistance Expert · Kinetic Operator</p>
          </div>
          <span className="ml-auto rounded-full bg-[#1f5a49] px-3 py-1 text-[11px] uppercase tracking-wider text-[#8af6bb]">
            Service complete
          </span>
        </div>
      </GlassCard>
      <GlassCard className="w-full max-w-2xl border-white/10 bg-[#273246]/90">
        <h1 className="font-sora text-5xl font-semibold text-white">How was your experience?</h1>
        <p className="mt-1 text-lg text-white/55">
          Your feedback helps us maintain high kinetic standards.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setStars(n)}
              className={cn(
                "rounded-xl p-2 transition-transform active:scale-90",
                n <= stars ? "text-[#90f8be]" : "text-white/20",
              )}
            >
              <Star className="h-10 w-10 fill-current" />
            </button>
          ))}
        </div>
        <p className="mt-6 text-[11px] uppercase tracking-[0.16em] text-white/45">Describe your service</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share details about the response time, professionalism, and quality..."
          rows={4}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0e1626] px-3 py-2 text-sm text-white"
        />
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {["Prompt arrival", "Professionalism"].map((tag) => {
            const active = tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  setTags((prev) =>
                    prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
                  )
                }
                className={cn(
                  "flex items-center justify-between rounded-xl border px-3 py-2 text-left",
                  active
                    ? "border-[#00E676]/40 bg-[#00E676]/10 text-white"
                    : "border-white/10 bg-[#1d2b3d] text-white/70",
                )}
              >
                {tag}
                {active ? <CheckCircle2 className="h-4 w-4 text-[#8cf4b8]" /> : <span className="h-4 w-4 rounded-full border border-white/30" />}
              </button>
            );
          })}
        </div>
        <Button className="mt-4 w-full" size="lg" type="button" onClick={submit}>
          Submit feedback
        </Button>
        <Link
          href="/driver/providers"
          className="mt-4 block text-center text-sm uppercase tracking-[0.16em] text-white/45 hover:text-white"
        >
          Skip for now
        </Link>
      </GlassCard>
    </div>
  );
}
