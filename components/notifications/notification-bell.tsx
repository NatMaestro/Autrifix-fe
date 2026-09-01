"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useNotifications } from "@/hooks/use-notifications";
import {
  isActionable,
  markRead,
  notificationHref,
  type Notification,
} from "@/services/notifications";
import { useAuthStore } from "@/store/auth-store";

function relativeTime(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86_400)}d ago`;
}

/**
 * The notification bell, backed by the real API.
 *
 * It replaced a button that fired `pushEvent("notification:demo")` — a fabricated local
 * event. That mattered more than it looked: `job.awaiting_confirmation` is how a customer
 * learns they are the one holding up a finished job, and without it the backend's
 * auto-confirmation window can close the job against someone who was never told.
 */
export function NotificationBell() {
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.user?.role);
  const { notifications, unread } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const readMut = useMutation({
    mutationFn: (id: string) => markRead(id),
    onSuccess: (result, id) => {
      qc.setQueryData<Notification[]>(["notifications"], (prev) =>
        (prev ?? []).map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
        ),
      );
      // The server returns the remaining count; use it rather than decrementing, so the
      // badge cannot drift away from reality across tabs or devices.
      qc.setQueryData<number>(["notifications", "unread-count"], result.unread_count);
    },
  });

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="relative rounded-2xl border border-slate-300/70 bg-white/85 p-2 text-slate-700 backdrop-blur-md dark:border-white/10 dark:bg-[#0B1F3A]/85 dark:text-white"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#00E676] px-1 text-[10px] font-semibold text-[#06251a]">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-300/70 bg-white shadow-xl dark:border-white/10 dark:bg-[#101c2e]">
          <div className="border-b border-slate-200 px-4 py-3 dark:border-white/10">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-white/45">
              Notifications
            </p>
          </div>

          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-white/45">
              Nothing yet.
            </p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {notifications.slice(0, 20).map((n) => (
                <li key={n.id}>
                  <Link
                    href={notificationHref(n, role)}
                    onClick={() => {
                      setOpen(false);
                      if (!n.read_at) readMut.mutate(n.id);
                    }}
                    className="block border-b border-slate-100 px-4 py-3 transition-colors hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5"
                  >
                    <div className="flex items-start gap-2">
                      {!n.read_at ? (
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                            isActionable(n) ? "bg-amber-400" : "bg-[#00E676]"
                          }`}
                        />
                      ) : (
                        <span className="mt-1.5 h-2 w-2 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                          {n.title || n.kind}
                        </p>
                        {n.body ? (
                          <p className="mt-0.5 text-xs text-slate-600 dark:text-white/60">
                            {n.body}
                          </p>
                        ) : null}
                        <p className="mt-1 text-[11px] text-slate-400 dark:text-white/35">
                          {relativeTime(n.created_at)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
