# SPEC-WEB-005 — Provider Dashboard

**Status:** IMPLEMENTED
**Scope:** Web
**Last synchronized with code:** 2026-09-01

> Filename retains `005-mechanic-dashboard.md` so the stable spec number resolves. The
> subject is a **provider** — mechanic is a trade, not a role (backend ADR-020).

## 1. Purpose

The provider's working surface: find claimable work, manage the jobs they hold, and keep
their profile and offerings current.

## 2. Routes

| Route | Purpose |
|---|---|
| `/provider` | Home — nearby open requests, live jobs |
| `/provider/job/[id]` | Single job: start, finish, notes |
| `/provider/history` | Past jobs |
| `/provider/earnings` | Earnings view |
| `/provider/navigate` | Turn-by-turn to the customer |
| `/provider/profile` | Profile, offerings |

## 3. Requirements

### WEB-005-1 — Discovery feed
**Status:** IMPLEMENTED

`listNearbyOpenRequests()` reads `/jobs/requests/nearby/` — unpaginated, capped at 50, with a
30-minute visibility window applied server-side.

### WEB-005-2 — Claiming a request
**Status:** IMPLEMENTED (2026-09-01)

`acceptJob()` posts to `/jobs/requests/{id}/accept/`, and the failures are now distinguished:

| Response | Meaning | Handled |
|---|---|---|
| `409` | Claimed, expired, or at concurrent-job cap | Names all three possibilities |
| `403 verification_required` | Below `PROVIDER_MIN_ACCEPT_LEVEL` | Names the level needed, with a **Verify** action linking to the panel |

The `403` is treated as a conversion moment rather than an error, which is the point of
letting unverified providers browse at all (backend ADR-019).

### WEB-005-3 — Profile and offerings
**Status:** IMPLEMENTED

`services/providers.ts` covers `/providers/profile/` and `/providers/services/` CRUD.
**These were `/mechanics/*` and 404'd until 2026-08-31.**

### WEB-005-3b — Provider trade
**Status:** IMPLEMENTED (2026-09-01)

A three-way selector (`mechanic` / `tow` / `both`) on the profile writes `provider_type`.
Until this existed every provider stayed a mechanic, so tow-capable matching could never
find anyone — the towing side of the product was unreachable from both directions.

### WEB-005-5 — Verification
**Status:** IMPLEMENTED (2026-09-01)

`components/providers/verification-panel.tsx`, above the fold on `/provider/profile`. Shows
the current level, what it unlocks (accepting jobs, exact locations), the profile
requirements still outstanding, and a three-file submission form.

It leads with what verification *unlocks* rather than what is missing, and states that
documents are deleted once reviewed — which is true (backend SPEC-013 REQ-8) and is the kind
of thing a provider reasonably wants to know before uploading an ID.

Previously the endpoint was complete and unreachable, so the gate protecting customers also
permanently locked out every provider it stopped.

### WEB-005-6 — Agencies
**Status:** IMPLEMENTED (2026-09-01)

`components/providers/agency-panel.tsx` covers the whole of SPEC-017: create, answer an
invitation, view the roster, invite by phone, leave, and remove. A provider belongs to at most
one agency, so the panel is always in exactly one of three states — no membership, an
invitation to answer, or a member view.

Backend refusals are translated rather than shown raw: `404` reads as "no provider account
uses that number", `409` as "already in an agency", and the last-owner `409` as "an agency
must keep at least one owner". The invitation view says that joining a verified agency can
raise the provider's own level, since that is the reason the feature exists.

Agency notifications now deep-link to `/provider/profile#agency`.

### WEB-005-4 — Coordinates in the feed are approximate
**Status:** DOCUMENTED, NOT SURFACED

Providers below the exact-location level receive coordinates snapped to a ~1 km grid, with
`distance_km` derived from the snapped point. The client renders them as exact. See OQ-W005-B.

## 4. Gaps

- **Earnings are computed client-side.** `/provider/earnings` derives figures from job rows;
  no earnings endpoint exists, because the platform records money but does not settle it.



## 5. Open questions

**OQ-W005-A — How should `403 verification_required` be presented?** — **ANSWERED 2026-09-01.**
As a toast naming the required level, with a **Verify** action deep-linking to
`/provider/profile#verification`. A blocking modal was considered and rejected: the provider
is browsing, and interrupting them contradicts the design that lets them browse in the first
place.

**OQ-W005-B — Should coarsened coordinates be shown as approximate?**
Rendering a snapped point as exact is misleading in a way that matters: the provider may
drive to a location that is up to ~1 km wrong and blame the platform.

## 6. Related

Backend SPEC-003, SPEC-006, SPEC-013 (verification), SPEC-014 (types and agencies).
