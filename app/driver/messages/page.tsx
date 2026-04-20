"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { listChatRooms } from "@/services/chat";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

export default function DriverMessagesEntryPage() {
  const roomsQ = useQuery({
    queryKey: ["chat-rooms"],
    queryFn: listChatRooms,
    staleTime: 10_000,
  });

  if (roomsQ.isLoading) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center px-4">
        <GlassCard className="border-slate-300/70 bg-white/90 text-slate-700 dark:border-white/10 dark:bg-[#1a2437]/90 dark:text-white/70">
          Loading chats...
        </GlassCard>
      </div>
    );
  }

  const rooms = roomsQ.data ?? [];
  if (!rooms.length) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center px-4">
        <GlassCard className="max-w-md border-slate-300/70 bg-white/95 text-center dark:border-white/10 dark:bg-[#1a2437]/90">
          <MessageCircle className="mx-auto h-6 w-6 text-slate-500 dark:text-white/50" />
          <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">No connected mechanics</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-white/60">
            You currently have no active chat contacts.
          </p>
          <div className="mt-4">
            <Link href="/driver">
              <Button size="sm">Back to home</Button>
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-3 py-4">
      <GlassCard className="border-slate-300/70 bg-white/95 p-3 dark:border-white/10 dark:bg-[#1a2437]/90">
        <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-white/45">Chats</p>
        <div className="mt-3 space-y-2">
          {rooms.map((room) => (
            <Link
              key={room.id}
              href={`/driver/chat/${room.job}`}
              className="block rounded-xl border border-slate-300/70 bg-white px-3 py-3 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {room.contact_name || "Assigned mechanic"}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-600 dark:text-white/60">
                {room.last_message || "No messages yet"}
              </p>
            </Link>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
