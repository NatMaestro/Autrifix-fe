"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { toWsBase } from "@/services/chat";
import { listNotifications, unreadCount, type Notification } from "@/services/notifications";
import { useAuthStore } from "@/store/auth-store";

/**
 * Notifications: REST for history and count, WebSocket for arrival.
 *
 * The socket carries the same row shape the list endpoint returns, so an arriving frame is
 * merged into the cached list rather than triggering a refetch. REST remains the source of
 * truth — a socket that drops must not silently stop the badge from ever updating again,
 * which is why the count is also polled on a slow interval.
 */
export function useNotifications() {
  const qc = useQueryClient();
  const access = useAuthStore((s) => s.access);

  const listQ = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotifications(),
    enabled: Boolean(access),
    staleTime: 30_000,
  });

  const countQ = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: unreadCount,
    enabled: Boolean(access),
    // Backstop for a dropped socket. Deliberately slow: the socket is the fast path, and
    // this only needs to stop the badge going permanently stale.
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!access) return;

    const ws = new WebSocket(
      `${toWsBase()}/ws/notifications/?token=${encodeURIComponent(access)}`,
    );

    ws.onmessage = (event) => {
      try {
        const frame = JSON.parse(event.data as string) as {
          kind?: string;
          data?: Notification;
        };
        if (frame.kind !== "notification" || !frame.data) return;

        const arrived = frame.data;

        qc.setQueryData<Notification[]>(["notifications"], (prev) => {
          const rows = prev ?? [];
          // The socket and a concurrent refetch can both deliver the same row.
          if (rows.some((n) => n.id === arrived.id)) return rows;
          return [arrived, ...rows];
        });
        qc.setQueryData<number>(["notifications", "unread-count"], (prev) => (prev ?? 0) + 1);
      } catch {
        // Malformed frame: ignore. The polled count still corrects the badge.
      }
    };

    return () => {
      ws.onmessage = null;
      ws.close();
    };
  }, [access, qc]);

  return {
    notifications: listQ.data ?? [],
    unread: countQ.data ?? 0,
    isLoading: listQ.isLoading,
  };
}
