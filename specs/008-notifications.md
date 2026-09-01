# SPEC-WEB-008 — Notifications

**Status:** IMPLEMENTED
**Scope:** Web
**Last synchronized with code:** 2026-09-01

## 1. Current state

Implemented on 2026-09-01. `services/notifications.ts`, `hooks/use-notifications.ts`, and
`components/notifications/notification-bell.tsx` back a real bell in both the customer and
provider shells.

It replaced `pushEvent("notification:demo")` — a fabricated local event that made the bell
look alive while the API was never called.

## 2. What the backend already emits

| Kind | Recipient | When |
|---|---|---|
| `request.accepted` | Customer | A provider claimed the request |
| `job.active` | Customer | Provider started |
| `quote.submitted` | Customer | Provider proposed a price |
| `quote.accepted` / `quote.declined` | Provider | Customer answered |
| `job.awaiting_confirmation` | Customer | **Provider finished; amount needs confirming** |
| `job.completed` | Provider | Customer confirmed |
| `job.auto_confirmed` | Customer | Silence closed the job |
| `job.cancelled`, `request.cancelled`, `request.expired` | Counterparty | — |
| `review.received` | Provider | — |
| `agency.invited`, `agency.invitation_answered`, `agency.membership_ended` | Provider | — |

## 3. Why this matters more than it looks

Two of these are not conveniences:

- **`job.awaiting_confirmation`** is how a customer learns they are now the blocker. Without
  it, jobs sit until auto-confirmation closes them (SPEC-016 REQ-2) — the customer is charged
  by timeout for a message they never received.
- **`agency.invited`** is the only signal a provider gets that they have been invited to an
  agency. There is no other surface.

## 4. Requirements

### WEB-008-1 — List, count, mark-read
**Status:** IMPLEMENTED

`services/notifications.ts`, typed from the generated schema. The count field is
`unread_count`, and `POST /notifications/{id}/read/` returns `{updated, unread_count}` — the
badge is set from that authoritative number rather than decremented locally, so it cannot
drift across tabs.

**Both shapes were guessed wrong on the first attempt** (`unread`, and a `Notification` body)
because they were hand-written instead of taken from the schema. That is the mistake ADR-003
exists to prevent, made inside the slice that cites it. Anchoring to `Schemas[...]` caught it.

### WEB-008-2 — Live arrival over WebSocket
**Status:** IMPLEMENTED

`ws/notifications/?token=` delivers `{kind: "notification", data: {...}}`, where `data` is the
same row shape the list endpoint returns — so an arriving frame is merged into the cached
list rather than triggering a refetch. Duplicate ids are ignored, since a socket frame and a
concurrent refetch can both deliver the same row.

REST remains the source of truth: the count is also polled once a minute, so a dropped socket
degrades to slow rather than to permanently stale.

### WEB-008-3 — A real unread badge
**Status:** IMPLEMENTED

Count on the bell, `aria-label` announcing it, and a dropdown listing the most recent 20.

### WEB-008-4 — Every notification is navigable
**Status:** IMPLEMENTED

`notificationHref()` maps kind + `payload` correlation ids to a destination. Actionable kinds
(`job.awaiting_confirmation`, `quote.submitted`, `agency.invited`) are marked amber rather
than green, because they ask the recipient to do something rather than merely inform them.

Backed by backend tests asserting those kinds actually carry `job_id`, and that
`job.awaiting_confirmation` carries `final_amount` and `currency`.

### WEB-008-5 — Unknown kinds degrade gracefully
**Status:** IMPLEMENTED

`notificationHref` falls through to the role's home rather than throwing, and the row renders
`title || kind`. The catalogue has grown four times already; a client that broke on an
unrecognised kind would make every backend addition a coordinated release.

## 5. Gaps

- **Agency notifications point at `/provider/profile`** because no agency UI exists yet
  (SPEC-WEB-005). They land somewhere real rather than 404, but the invitation itself cannot
  be answered from the web app.
- No "mark all read", and no dedicated notifications page — the dropdown caps at 20.
- The unread badge does not survive a hard reload before the first fetch resolves.

## 6. Open questions

**OQ-W008-A — Push, or in-app only?**
Backend SPEC-010 OQ-010-C is unresolved. In-app alone cannot reach a stranded customer with
the app closed, which is the case the product exists for.

## 7. Related

Backend SPEC-010, SPEC-015, SPEC-016, SPEC-017.
