import { api } from "@/lib/api";
import { unwrapList, type Notification, type Paginated, type Schemas } from "@/lib/api-schema";

export type { Notification };

/** Kind strings the backend may send. Kept as a widened string on purpose — see below. */
export type NotificationKind = Notification["kind"];

export async function listNotifications(options?: { unreadOnly?: boolean }) {
  const { data } = await api.get<Paginated<Notification> | Notification[]>("/notifications/", {
    params: options?.unreadOnly ? { unread: "true" } : undefined,
  });
  return unwrapList(data);
}

/**
 * Badge count.
 *
 * The field is `unread_count`, not `unread` — typed from the generated schema rather than
 * guessed. Hand-writing this shape is exactly the mistake ADR-003 exists to stop, and it was
 * made here first time round: the hand-written version read `data.unread` and would have
 * shown a permanent zero.
 */
export async function unreadCount(): Promise<number> {
  const { data } = await api.get<Schemas["NotificationUnreadCountResponse"]>(
    "/notifications/unread-count/",
  );
  return Number(data?.unread_count ?? 0);
}

/**
 * Mark one notification read. Returns the **authoritative** remaining count, so the badge is
 * corrected from the server rather than decremented optimistically and allowed to drift.
 */
export async function markRead(id: string) {
  const { data } = await api.post<Schemas["NotificationMarkReadResponse"]>(
    `/notifications/${id}/read/`,
  );
  return data;
}

/**
 * Where a notification points.
 *
 * `Notification` has no foreign key to its subject; `payload` carries the correlation ids
 * instead, which is the documented contract. A notification the user cannot act on is close
 * to useless, so every kind that has a destination gets one.
 *
 * Unknown kinds fall through to the list rather than throwing — the catalogue has grown four
 * times already, and a client that breaks on an unrecognised kind would turn every backend
 * feature into a coordinated release.
 */
export function notificationHref(
  notification: Notification,
  role: "customer" | "provider" | "admin" | undefined,
): string {
  const payload = (notification.payload ?? {}) as Record<string, unknown>;
  const jobId = typeof payload.job_id === "string" ? payload.job_id : null;
  const base = role === "provider" ? "/provider" : "/customer";

  switch (notification.kind) {
    case "job.awaiting_confirmation":
    case "quote.submitted":
      // The two that need the customer to *do* something — send them where they can.
      return jobId ? `/customer/track?jobId=${jobId}` : "/customer";

    case "request.accepted":
    case "job.active":
      return jobId ? `/customer/track?jobId=${jobId}` : "/customer";

    case "quote.accepted":
    case "quote.declined":
    case "job.completed":
      return jobId ? `/provider/job/${jobId}` : "/provider";

    case "review.received":
      return "/provider/profile";

    case "agency.invited":
    case "agency.invitation_answered":
    case "agency.membership_ended":
      return "/provider/profile#agency";

    case "job.auto_confirmed":
    case "job.cancelled":
    case "request.cancelled":
    case "request.expired":
      return base;

    default:
      return base;
  }
}

/** Kinds that represent something the recipient must act on, not merely be told. */
const ACTIONABLE: ReadonlySet<string> = new Set([
  "job.awaiting_confirmation",
  "quote.submitted",
  "agency.invited",
]);

export function isActionable(notification: Notification): boolean {
  return ACTIONABLE.has(notification.kind);
}
