# SPEC-WEB-002 — Customer Dashboard

**Status:** IMPLEMENTED
**Scope:** Web
**Last synchronized with code:** 2026-09-01

## 1. Purpose

The customer's home: report a problem, see nearby help, and track anything in flight.

## 2. Routes

| Route | Purpose |
|---|---|
| `/customer` | Home — issue entry, nearby providers, live request panel |
| `/customer/issues` | Guided issue capture and request creation |
| `/customer/providers` | Nearby providers list |
| `/customer/matching` | Waiting for a provider to claim |
| `/customer/in-progress`, `/customer/track` | Active job |
| `/customer/completed` | Finished jobs |
| `/customer/profile` | Profile |

## 3. Requirements

### WEB-002-1 — Location drives the dashboard
**Status:** IMPLEMENTED

`hooks/use-geolocation.ts` supplies the coordinate passed to `/services/nearby/` and
`/jobs/requests/`. Leaflet renders the map (`react-leaflet`), with a styled fallback when no
map token is configured.

### WEB-002-2 — Nearby providers are read live
**Status:** IMPLEMENTED

`truncated` is now returned by `nearbyServices()` (2026-09-01); the backend caps results at
50 and the flag was previously discarded, so a capped list looked like the whole picture.

`services/services.ts → nearbyServices()` calls `/services/nearby/` and returns
`categories`, `providers`, `nearby_providers_count`, `radius_km`.

**Field names were wrong until 2026-08-31** — the client read `mechanics` and
`nearby_mechanics_count`, which the backend had renamed. Silent empty lists, no error.

### WEB-002-3 — Live presence over WebSocket
**Status:** IMPLEMENTED

`hooks/use-customer-nearby-providers-ws.ts` subscribes to provider presence and updates the
map without polling. `store/realtime-store.ts` holds the fan-out.

### WEB-002-4 — Completed jobs
**Status:** IMPLEMENTED (2026-09-01)

`/customer/completed` reads `/jobs/` and shows the real service, provider, completion date,
and agreed amount, with a link to review that job.

**It was previously a fabricated receipt** — an invented job id, line items
(GH₵85.00 + GH₵120.00 + a "tech service fee"), a total, and "Visa • 4482". The card line was
actively false: Autrifix processes no payments at all, and settlement is direct between
customer and provider (backend ADR-022). A customer reading it would believe they had
already paid. It now states plainly that payment goes directly to the provider.

A job closed by timeout rather than by the customer is labelled as such, using
`auto_confirmed` — exposed on the job serializer on 2026-09-01, having been recorded on the
model since SPEC-016 but never surfaced.

## 4. Gaps

- The dashboard itself does not surface a job in `awaiting_confirmation`; the money panel
  lives on `/customer/track` and `/customer/in-progress`, and notifications carry the user
  there. A home-screen banner would still be an improvement.
- `/customer/track` no longer shows a fabricated "★ 4.9" for every provider, but shows no
  rating at all — `Job` does not carry one.

## 5. Open questions

**OQ-W002-A — What should the customer see when no providers are nearby?**
Currently an empty map. Given supply is thin at launch, this is the most likely first
experience and it has no designed empty state.

## 6. Related

Backend SPEC-002, SPEC-006 (discovery), SPEC-008 (location).
