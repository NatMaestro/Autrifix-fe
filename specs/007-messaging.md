# SPEC-WEB-007 — Messaging

**Status:** IMPLEMENTED
**Scope:** Web
**Last synchronized with code:** 2026-09-01

## 1. Purpose

Per-job conversation between the customer and the provider attending them.

## 2. Routes

`/customer/chat/[jobId]`, `/provider/chat/[jobId]`, plus `/customer/messages` and
`/provider/messages` as inboxes.

## 3. Requirements

### WEB-007-1 — One room per job
**Status:** IMPLEMENTED

Rooms are addressed by `job_id`. `services/chat.ts` reads `/chat/`, `/chat/jobs/{job_id}/`,
and posts to `/chat/jobs/{job_id}/messages/`. Non-participants get `404` from the backend.

### WEB-007-2 — Live delivery over WebSocket
**Status:** IMPLEMENTED

The chat socket carries messages and typing frames; `store/realtime-store.ts` fans them out.
REST is the fallback and the history source.

### WEB-007-3 — Text and images
**Status:** IMPLEMENTED

Body and/or image, matching the backend. `emoji-picker-react` supplies emoji entry.

## 4. Gaps

- **Unread counts are local.** `store/realtime-store.ts` tracks unread in memory; nothing
  reads a server-side count, so the badge resets on reload and does not survive devices.
- **Message history is unpaginated** in the embedded room response, matching a backend
  limitation already recorded there.
- No optimistic send state, so a slow network looks like a dropped message.

## 5. Open questions

**OQ-W007-A — Should chat remain available after a job completes?**
Currently the room persists. Whether it should stay writable after completion — and for how
long — is undecided on both sides.

## 6. Related

Backend SPEC-009.
