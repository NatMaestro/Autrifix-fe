# SPEC-WEB-003 — Service Request Experience

**Status:** IMPLEMENTED
**Scope:** Web
**Last synchronized with code:** 2026-09-01

## 1. Purpose

Turning "my car won't start" into a request a provider can claim.

## 2. Routes

`/customer/issues` (guided capture), `/customer` (quick tags), `/customer/matching` (post-submit).

## 3. Requirements

### WEB-003-1 — Free text is routed to a category
**Status:** IMPLEMENTED

`services/services.ts → routeIssue()` posts to `/ai/route-issue/` and receives
`category_id`, `confidence`, `method` (`rules | ml | fallback | none`). The returned id is
used to create the request.

### WEB-003-2 — Requests are created against the canonical endpoint
**Status:** IMPLEMENTED (2026-08-31)

`POST /jobs/requests/`. The client previously used `/requests/create/`, the legacy duplicate
the backend flags for removal.

### WEB-003-3 — Write and read shapes differ
**Status:** IMPLEMENTED

`createRequest` takes `ServiceRequestInput`, where `category` is a UUID. The response returns
the full category object. Declared per-direction in the backend schema.

### WEB-003-4 — Tow destination
**Status:** IMPLEMENTED (2026-09-01)

Categories the backend marks `requires_destination` relocate the vehicle, and the request is
rejected without one. `/jobs/categories/` now exposes the flag, and the client pauses on a
map picker (`components/jobs/destination-picker.tsx`) before submitting.

Map-first rather than an address field: there is no geocoder in the stack, and a stranded
customer is likelier to recognise a place on a map than to type an address a driver can act
on. `AutriMap` gained an `onPick` prop for this.

The routed category is held while the picker is open rather than re-routing afterwards —
re-running the classifier could land on a different category and silently change what the
customer is asking for.

**This completed the towing path**, which had been unreachable from the web app since the
backend shipped it in SPEC-014.

### WEB-003-5 — Cancelling a request
**Status:** IMPLEMENTED (2026-09-01)

`cancelRequest()` is wired on `/customer/track`. It previously redirected client-side only:
the request stayed open on the backend and the assigned provider was never told. The `409`
for cancelling finished-but-unconfirmed work is handled with its own message.

### WEB-003-6 — Quick issue tags
**Status:** IMPLEMENTED

`ISSUE_QUICK_TAGS` in `lib/constants.ts` (engine, tire, battery, accident) seed the free-text
box rather than bypassing routing.

## 4. Gaps


- **`409` at the open-request cap is unhandled** on this page; `/customer/track` handles its
  own `409` on cancel, but request creation still shows a generic failure.


## 5. Open questions

**OQ-W003-A — Where does the tow destination get captured?** — **ANSWERED 2026-09-01.**
A map picker shown between routing and submission. Open follow-up: the picker has no address
search, so a customer must recognise the destination visually. Adequate for "tow it to my
usual garage"; weaker for an unfamiliar address. Revisit if a geocoder enters the stack.

**OQ-W003-B — Should low routing confidence ask the user to confirm the category?**
`method` and `confidence` are returned and currently discarded.

## 6. Related

Backend SPEC-005, SPEC-014 (tow destinations), SPEC-016 (caps).
