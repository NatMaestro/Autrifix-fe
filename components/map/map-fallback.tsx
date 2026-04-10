"use client";

import { motion } from "framer-motion";

/** Stylized “live grid” map when no Google API key — still feels map-first & premium. */
export function MapFallback({
  centerLabel = "Accra corridor",
  children,
}: {
  centerLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#050a12]">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,230,118,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,230,118,0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(11,31,58,0.2),transparent_55%)]" />
      <motion.div
        className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00E676] shadow-[0_0_30px_#00E676]"
        animate={{ scale: [1, 1.4, 1], opacity: [0.9, 1, 0.9] }}
        transition={{ duration: 2.2, repeat: Infinity }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#00E676]/40"
        animate={{ scale: [0.8, 1.15], opacity: [0.4, 0.1] }}
        transition={{ duration: 2.2, repeat: Infinity }}
      />
      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs text-white/70 backdrop-blur-md">
        <span className="text-[10px] uppercase tracking-[0.25em] text-[#00E676]">
          Live grid
        </span>
        <span>{centerLabel}</span>
      </div>
      {/* Mock markers */}
      {[
        { x: "22%", y: "38%", delay: 0 },
        { x: "68%", y: "52%", delay: 0.4 },
        { x: "54%", y: "30%", delay: 0.8 },
      ].map((m, i) => (
        <motion.div
          key={i}
          className="absolute flex h-3 w-3 items-center justify-center"
          style={{ left: m.x, top: m.y }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: m.delay, duration: 0.5 }}
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400/40" />
          <span className="relative h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
        </motion.div>
      ))}
      {children}
    </div>
  );
}
