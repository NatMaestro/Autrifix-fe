"use client";

import { motion } from "framer-motion";

/** Deep-space aurora wash — signature AutriFix atmosphere. */
export function AuroraBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#eef4ff] dark:bg-[#030712]"
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#f6f9ff] via-[#e8f0ff] to-[#dce9ff] dark:from-[#050a14] dark:via-[#0B1F3A] dark:to-[#030712]" />
      <motion.div
        className="absolute -left-1/4 top-0 h-[70vh] w-[70vw] rounded-full bg-[#00E676]/10 blur-[120px] dark:bg-[#00E676]/15"
        animate={{ opacity: [0.35, 0.55, 0.35], scale: [1, 1.05, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-1/4 bottom-0 h-[60vh] w-[60vw] rounded-full bg-cyan-500/15 blur-[100px] dark:bg-cyan-500/10"
        animate={{ opacity: [0.2, 0.4, 0.2], x: [0, -20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute inset-0 opacity-[0.08] dark:hidden"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23647FA8' fill-opacity='1'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5l12.98 7.5V49h-2v-6.35L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31L15.01 6.5 15 0zm0 49v-8l12.99-7.5H28v2.31L15.01 42.5 15 49z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div
        className="absolute inset-0 hidden opacity-[0.07] dark:block"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5l12.98 7.5V49h-2v-6.35L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31L15.01 6.5 15 0zm0 49v-8l12.99-7.5H28v2.31L15.01 42.5 15 49z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,230,118,0.06),_transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(0,230,118,0.08),_transparent_55%)]" />
    </div>
  );
}
