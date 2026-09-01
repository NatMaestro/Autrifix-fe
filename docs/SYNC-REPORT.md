# Web Spec Synchronization Report

**Date:** 2026-09-01
**Scope:** `autrifix-web` — Next.js 15.5 App Router, React 19, TypeScript 5.7

All ten web specs were identical boilerplate before this pass — a template header and an
instruction to inspect the code. Nothing had been synchronized. This report records what the
web app actually does, measured against the backend contract as it stands today.

## 1. What is implemented

| Area | State | Notes |
|---|---|---|
| Authentication | **IMPLEMENTED** | Password, Google, OTP (deprecated on web). Token refresh de-duplicated. Role now chosen before account creation |
| Customer dashboard | **IMPLEMENTED** | Geolocation, live nearby providers over WebSocket, Leaflet map |
| Service requests | **IMPLEMENTED** | AI issue routing → category → `POST /jobs/requests/` |
| Vehicles | **IMPLEMENTED** | Full CRUD against `/customers/vehicles/` |
| Provider dashboard | **IMPLEMENTED** | Discovery feed, claim, profile, offerings |
| Messaging | **IMPLEMENTED** | Per-job rooms, WebSocket delivery, text and images |

## 2. What is partially implemented

**Job management (SPEC-WEB-006) — the significant one.** The provider half of two-sided
completion works: a provider starts a job, records an amount, and the job moves to
`awaiting_confirmation`. **The customer half does not exist.** `confirmJob()` is written and
called from nowhere, so no job can be completed from the UI; every one stalls until the
backend's auto-confirmation window closes it against the customer.

**Claiming a request (SPEC-WEB-005).** `403 verification_required` is rendered as a generic
error, discarding `current_level`, `required_level`, and `verification_url`. That response is
the intended conversion moment for the entire verification design, and the UI throws it away.

**Completed-jobs list.** `/customer/completed` renders from local state and calls no API.

## 3. What is missing entirely

| Missing | Backend status | Consequence |
|---|---|---|
| **Notifications** | Complete — 14 kinds, per-user socket | No `services/notifications.ts` exists. The bell fires a fabricated demo event |
| **Quotes** | Complete | `submitQuote` / `respondToQuote` exist and are called from nowhere. The agreed-price feature is unreachable |
| **Amount variance** | Complete | The customer would confirm an amount without seeing how it compares to what they agreed |
| **Provider verification** | Complete | No submission form, no status. A provider blocked below `PROVIDER_MIN_ACCEPT_LEVEL` cannot unblock themselves in-product |
| **Agencies** | Complete (SPEC-017) | Create, invite, respond, roles — no UI at all |
| **Reviews** | Complete | No `services/reviews.ts` |
| **Tow destination** | Required by backend | `requires_destination` categories cannot be requested correctly. Towing was an explicit product priority |
| **`provider_type`** | Complete | A tow operator cannot declare their trade |
| **Request cancellation** | Complete | `cancelRequest()` called from nowhere |

## 4. Conflicts with the backend contract

All six broken endpoint paths and the role-vocabulary drift were **resolved on 2026-08-31**;
they are recorded here because the way they were found matters more than the fix.

| Was | Now | How it was found |
|---|---|---|
| `/drivers/profile/`, `/drivers/vehicles/` | `/customers/…` | Only after generating types from the schema |
| `/mechanics/profile/`, `/mechanics/services/` | `/providers/…` | Same |
| `UserRole = "driver" \\| "mechanic"` | `customer \\| provider \\| admin` | Same |
| `mechanic_name`, `driver_name` | `provider_name`, `customer_name` | Same |
| `nearby_mechanics_count`, `mechanics` | `nearby_providers_count`, `providers` | Same |
| `/requests/create/` | `/jobs/requests/` | Legacy duplicate |

**`tsc --noEmit` passed cleanly through all of it.** TypeScript was checking hand-written
types that lied. Adopting the generated client (ADR-003) surfaced 67 errors immediately.

One conflict ran the other way: `ServiceRequest.category` was *documented* as a UUID while the
API returned the whole object. The client's defensive handling was right and the schema was
wrong. Fixed in the backend with a direction-aware field extension.

## 5. Defects, as distinct from gaps

Two places actively mislead the user rather than merely lacking a feature:

1. **`/customer/rate` claims a review was submitted.** It shows
   `"Thanks — review queued (POST /reviews/)"` and sends nothing. The provider will never
   receive it.
2. **`/admin/*` is a convincing shell with no backend.** Five routes, all hardcoded arrays,
   reachable in a production build. An operator could believe they had approved a
   verification — the gate that decides who attends a stranded customer.

Both are recorded in their specs. Neither was fixed in this pass, because the honest fixes
differ (one needs wiring, one needs a product decision about whether the routes ship at all).

## 6. What requires a product decision

| Ref | Question |
|---|---|
| **OQ-W006-A** | Where does the customer confirm an amount? This blocks the money model end-to-end |
| **OQ-W003-A** | Where is the tow destination captured? Towing is unusable without it |
| **OQ-W005-A** | How is `403 verification_required` presented — as an error, or as the conversion moment it was designed to be? |
| **OQ-W010-A** | Should the admin routes ship before SPEC-012 exists? |
| **OQ-W008-A** | Push notifications, or in-app only? (backend OQ-010-C) |
| **OQ-W009-A** | Where is a provider's rating shown? It is computed and displayed nowhere |

## 7. Recommended next slice

**Customer-side money UI.** It is the only item that makes a completed backend feature
reachable rather than adding new surface: the confirm action, the amount and variance
display, and the quote accept/decline. Everything else in section 3 is additive; this one
closes a loop that is currently open in production code.

After that, **notifications** — because `job.awaiting_confirmation` is how the customer learns
they are the blocker, and without it the confirm UI will not be found.

## 8. Not addressed by this pass

- **There is no test framework.** No vitest, jest, or playwright. Nothing in the web app is
  tested, so no spec here can reach `VERIFIED` under CLAUDE.md §10 — the highest status any
  of them can honestly carry today is `IMPLEMENTED`.
- No accessibility or responsive audit was performed; the spec template asks for both.


---

## Addendum — 2026-09-01: the money loop is closed

Section 7 recommended the customer-side money UI as the next slice. It is done.

| Was | Now |
|---|---|
| `confirmJob()` called from nowhere | Confirm panel on `/customer/track` and `/customer/in-progress` |
| Quote functions called from nowhere | Provider submits/revises; customer accepts/declines |
| `amount_variance` never rendered | Amber callout when the amount exceeds the accepted quote |
| SPEC-WEB-006 `IN_PROGRESS` | `IMPLEMENTED` |

Two bugs surfaced while wiring it, neither visible from reading the code:

- Both customer live-job pages excluded `awaiting_confirmation` from their job lookup, so the
  single state that needs the customer's attention was the one they could not reach. Fixed on
  both, and the panel is on both because chat links to one page and matching to the other.
- The backend's `as_user` test fixture re-authenticated one **shared** client. Binding two
  roles up front silently gave two names for the same client, authed as whoever was passed
  last. Every prior test called it inline and never noticed. It now returns a fresh client per
  call; all 393 tests pass.

The sequence is now covered end-to-end by `tests/test_money_flow_end_to_end.py` in the
backend, walked in the order the client performs it.

### What is now the top gap

**Notifications (SPEC-WEB-008).** The confirm panel exists, but nothing tells the customer to
come and use it — the backend emits `job.awaiting_confirmation` and the web app consumes no
notifications at all. Auto-confirmation can still close a job against someone who never saw
the request. The UI is reachable; it is not yet *findable*.


---

## Addendum — 2026-09-01: notifications wired

The previous addendum named notifications as the top gap: the confirm panel existed but
nothing told the customer to use it. Done.

`services/notifications.ts` + `hooks/use-notifications.ts` + `NotificationBell`, in both the
customer and provider shells. REST for history and count, WebSocket for arrival, with the
count also polled once a minute so a dropped socket degrades to slow rather than to silently
stale. Every notification routes to its subject via the `payload` correlation ids, and the
three kinds that ask for an action are marked distinctly from the ones that merely inform.

**Worth recording: I got the response shapes wrong first time.** `unreadCount` read
`data.unread` (the field is `unread_count`) and `markRead` was typed as returning a
`Notification` (it returns `{updated, unread_count}`). Both were hand-written rather than
taken from the generated schema — the exact mistake ADR-003 exists to prevent, made inside
the slice that cites it. Typing them from `Schemas[...]` surfaced both immediately. The badge
would otherwise have shown a permanent zero, which is indistinguishable from working.

Two backend tests now pin what the bell depends on: that actionable kinds carry `job_id`, and
that `job.awaiting_confirmation` carries `final_amount` and `currency`. 395 passing.

Also cleared the last 16 vocabulary leftovers the earlier rename passes missed — all
camelCase or SCREAMING_SNAKE compounds where `` cannot match (`useDriverNearbyMechanicsWs`,
`mergeMechanicUpdate`, `DRIVER_VEHICLE_PACK_STORAGE_KEY`, and similar). `grep` for
driver/mechanic outside the generated types now returns **0**.

### Now the top gap

**Provider verification (SPEC-WEB-005).** A provider blocked below
`PROVIDER_MIN_ACCEPT_LEVEL` still has no in-product way to submit documents, and
`403 verification_required` is still rendered as a generic error — discarding the
`verification_url` the backend sends specifically to route them there. That is the conversion
moment the whole verification ladder was designed around, and it currently reads as "something
went wrong".

### Noted but not fixed

ESLint does not run in this project: `eslint-config-next` cannot resolve
`@typescript-eslint/eslint-plugin`, which is why `next.config.ts` sets
`eslint.ignoreDuringBuilds: true`. Dead imports and unused variables therefore go unreported —
several were removed by hand during this slice.

---

## Addendum — 2026-09-01: defects fixed

### ESLint was broken, and it was hiding real bugs

`@typescript-eslint/eslint-plugin` and `es-abstract` were **truncated on disk** — directories
present, JavaScript files missing — almost certainly from `npm install` running while C: was
full. Every ESLint invocation crashed, which is why `next.config.ts` set
`eslint.ignoreDuringBuilds: true`.

A clean reinstall repaired them. The first run reported 10,018 problems, because nothing
excluded `.next/` and the generated `lib/api-types.ts`; with proper `ignores` that fell to 52.

**26 of the remaining errors were `react-hooks/rules-of-hooks` violations** in the two chat
pages: `if (!jobIdParam) return null;` sat above ten more hooks, so React saw a different hook
count depending on the URL — the "rendered fewer hooks than expected" crash. Fixed by keeping
every hook unconditional, gating the queries on a boolean, and moving the early return below
the last hook.

The project now reports **0 errors, 30 warnings**, and `ignoreDuringBuilds` is back off. A
build that ignores its linter is a linter nobody reads.

### Provider verification

`components/providers/verification-panel.tsx` on `/provider/profile`, plus real handling of
`403 verification_required` at the accept call site — the level needed, and a **Verify**
action deep-linking to the panel. Previously the endpoint was complete and unreachable, so the
gate protecting customers also permanently locked out every provider it stopped.

### `/customer/rate` no longer lies

It posted nothing and reported success. It now submits for real, reads the job rather than
hardcoding "Marcus Sterling", handles the duplicate-review case with its own message, and
reports failure honestly.

### `/admin` says what it is

A persistent banner on every admin page: not connected, nothing real, use Django admin.
Chosen over deleting the routes, which would discard design work needed when SPEC-012 lands.

### Towing

Two of the three blockers are gone. `provider_type` is now settable (repairs / towing / both),
so tow operators can be matched at all; and `/jobs/categories/` exposes `requires_destination`
so the client stops submitting tow requests it knows will be rejected.

**The third remains:** capturing a destination needs point-selection on the map, and
`AutriMap` has no `onPick` or draggable marker. Until then the client says plainly that
towing is not supported here rather than failing with a field error.

### Now the top gap

**The tow destination picker.** It is the last thing standing between the towing side of the
product and being usable, the backend has been ready since SPEC-014, and the blocker is
entirely client-side.

Smaller and still open: `/customer/completed` renders from local state, `truncated` from
`/services/nearby/` is ignored, `cancelRequest()` is called from nowhere, and provider ratings
are computed but displayed nowhere.


---

## Addendum — 2026-09-01: tests and CI

Section 8 recorded "there is no test framework" as the reason nothing could reach `VERIFIED`.
There is one now.

**Vitest + jsdom + Testing Library, 34 tests over three files** (ADR-005), covering the
hand-written layer above the generated types and the two components that gate real outcomes:

- `JobMoneyPanel` — the only way a job can be completed. Tests assert the confirm action
  names the amount, the variance warning appears only when the amount *exceeds* the accepted
  quote, and the panel states that the platform does not handle the payment. A customer who
  believes confirming pays the provider would walk away without paying.
- `VerificationPanel` — the only route out of being blocked. Tests assert it names the level
  required, lists outstanding requirements in plain language, distinguishes pending from
  rejected submissions, and says documents are deleted after review.
- Contract helpers — `unwrapList`, `jobStatusLabel`, `notificationHref`,
  `asVerificationRequired`. Each encodes a decision a rename could silently invert, and one
  test pins that `awaiting_confirmation` reads as "Awaiting **your** confirmation", since the
  neutral phrasing hides who is being waited on.

**CI** (`.github/workflows/ci.yml`) runs typecheck, lint, test, and build — plus a second job
that exports the schema from the backend, regenerates the types, and fails if the committed
ones are stale. That job is what makes ADR-003 hold: a stale `api-types.ts` typechecks
perfectly and lies exactly as the hand-written types did.

Two details that would otherwise have made the drift check useless:

- `git add --intent-to-add` before diffing, or untracked generated files are ignored and the
  check passes vacuously.
- `.gitattributes` normalizing line endings, or the Windows-generated file diffs against the
  Linux-regenerated one on every line.

### Still the top gap

**The tow destination picker**, unchanged. `AutriMap` has no point-selection, the backend has
been ready since SPEC-014, and until it exists the client correctly refuses tow requests
rather than submitting ones it knows will fail.

---

## Addendum — 2026-09-01: remaining gaps closed

Everything section 3 listed as missing is now built, plus two defects the sweep uncovered.

| Gap | Now |
|---|---|
| Tow destination | Map picker between routing and submission. `AutriMap` gained `onPick` |
| Agencies | Full SPEC-017 surface: create, invite, respond, roles, leave, remove |
| `/customer/completed` | Reads real jobs; the fabricated receipt is gone |
| `truncated` | Returned by `nearbyServices()` |
| `cancelRequest()` | Wired on `/customer/track`, with the `409` explained |
| `provider_type` | Trade selector on the provider profile |
| Provider verification | Panel plus real `403 verification_required` handling |

### Two defects found while sweeping

**`/customer/completed` fabricated a paid invoice.** Line items, a total, and "Visa • 4482".
Autrifix processes no payments at all — settlement is cash between the two parties
(ADR-022) — so a customer reading that page would believe they had already paid. It now shows
the real agreed amount and says payment goes directly to the provider.

**`/customer/track` showed "★ 4.9" for every provider**, regardless of their actual rating.
Removed rather than faked: `Job` carries no rating field.

### One thing I got wrong

An earlier addendum claimed provider ratings were "computed but displayed nowhere". They are
displayed in five places — the customer map, the providers list, the provider home twice, and
the provider profile. Checking before fixing turned a non-issue into finding the fabricated
4.9 instead.

### A gap the typed client caught

`Job.auto_confirmed` had been on the model since SPEC-016 and was never added to the
serializer, so no client could distinguish a job the customer agreed to from one the timeout
closed against them — which was the entire reason for recording it. Exposed, and now shown on
the completed page.

### Testing

43 frontend tests over four files; the agency panel's three mutually exclusive states are
covered, since rendering the wrong one is the whole failure mode. Backend at 396.

### What remains

- **`/provider/earnings` computes figures client-side** from job rows. No earnings endpoint
  exists because the platform records money without settling it, so the page risks implying a
  payout that does not exist. Worth a product decision rather than more code.
- The destination picker has **no address search** — adequate for "tow it to my usual
  garage", weaker for an unfamiliar address. Needs a geocoder.
- `409` at the open-request cap is still a generic failure on `/customer/issues`.
- Admin remains a prototype behind its banner, correctly, until SPEC-012 exists.

---

## Addendum — 2026-09-01: everything else

### `/provider/earnings` was fabricating money

I had called this a product decision. It was not — it was invented data, and real amounts now
exist. `estimateJobAmount` guessed from the category name (battery 85, tire 120, engine 170),
summed the guesses, and presented the total as the provider's earnings beside a **"Withdraw
funds"** button and "Payout flow coming soon".

There is no wallet and no payout: the platform records money and the two parties settle in
cash (ADR-022). The page now uses `job.final_amount` — what each customer actually confirmed —
and the withdraw button is replaced by a line saying funds are collected directly.

### The customer's saved location was write-only

`CustomerProfileSerializer` declared `latitude`/`longitude` as `write_only` while a
`to_representation` override returned them anyway. Readable in practice, undocumented in the
schema, so no generated client knew the saved location existed — **the third instance of this
exact bug**, after `ServiceRequest.category` and `Job.auto_confirmed`.

Fixed with `source="home_latitude"`, which lets DRF map both directions and removes the
override and the custom `update` entirely. The destination picker now offers "Use my saved
location", which is the closest thing to address search available without a geocoder.

It also revealed that my own `patchCustomerProfile` sent `home_latitude`/`home_longitude` —
field names that do not exist on the API. DRF ignores unknown fields, so it had been failing
silently.

### Lint: 1811 errors → 0, 30 warnings → 0

Beyond the 26 hook-order violations fixed earlier:

- **4 memo-defeating patterns.** `const jobs = jobsQ.data ?? []` creates a new array every
  render, so every `useMemo`/`useEffect` depending on it re-ran constantly. Memoised.
- **`mapMessage` stabilised** with `useCallback` in both chat pages, so the effects can
  declare it honestly instead of omitting it.
- **Two dependency arrays I had broken myself** — I added a `hasJobId` guard inside the socket
  effects without adding it to the deps, so navigating from a missing id to a real one would
  never have opened the socket.
- **Dead imports and values removed.**
- **False positives scoped, not silenced blindly.** `no-img-element` is off for `icon`,
  `apple-icon`, and `opengraph-image`, which render through Satori inside `ImageResponse`
  where `next/image` cannot be used at all; and for avatars and map markers, which come from
  a remote host that varies per environment and would need build-time `remotePatterns`
  covering every deployment.
- **Six intentional omissions carry an inline reason** rather than a bare disable — each
  explains what re-running would break (reopening a socket, discarding edits in progress).

### Also

`409` at the open-request cap now reads as "you already have requests waiting" on
`/customer/issues`, rather than a generic failure the customer would keep retrying.

### Left undone, deliberately

**The admin backend.** `/admin` stays a prototype behind its banner because SPEC-012 is
deferred by ADR-017 — a product decision, made explicitly. Building it would reverse that
decision unilaterally, which is not mine to do. It is the one remaining item on this list that
needs an answer rather than code.

---

## Addendum — 2026-09-01: administration built

The last item. ADR-017 had deferred it; ADR-024 unparks the part that became load-bearing.

**Backend** — five endpoints under `/api/v1/admin/`, gated on `IsAdmin`, a permission class
that had existed since the beginning and was applied to nothing. Verification queue and
review, user search, job history, operational counts. 27 tests, mostly authorization: an
operator endpoint leaking to a customer or provider would expose every user's contact details
and every job on the platform.

**Frontend** — all five admin routes now read live data and the prototype banner is gone.

### What is excluded, and why

- **Private conversations.** SEC-GAP-17/34 records that admin chat reads are unaudited; not
  exposing them means this does not widen that gap.
- **The verification documents.** Serving identity documents through a JSON API protects them
  with nothing but a URL. Reviewers open them in Django admin. Recorded as OQ-012-I.
- **Editing accounts.** Still Django admin's job — an editable operator API needs the scoped
  roles that do not exist.
- **Operator roles.** `admin` stays all-or-nothing. Support, ops, and finance plausibly want
  different visibility, but that is a product question (OQ-012-B), and guessing would bake in
  a permission model nobody chose.

### Two decisions worth naming

**The queue is oldest-first.** Newest-first starves whoever has waited longest, which is
precisely the complaint verification delays generate.

**A decline requires a reason,** enforced server-side. Without one the provider has nothing to
act on, and a review queue becomes a dead end for them.

### More fabrication found

`/admin/status` reported **"Payments: Degraded"** and **"Dispatch Queue: Nominal"**. Neither
system exists — discovery is pull-based (ADR-005) and no payments are processed at all
(ADR-022). "Degraded" reads as a broken subsystem rather than an absent one, which is a
materially different thing for an operator to act on. It now shows one real health check and
says plainly what is absent by design.

The dashboard also now leads with **pending verifications** — the only number representing
work waiting on a person — and flags **jobs closed by timeout**, each one a customer charged
because they did not answer rather than because they agreed.

### Status

All ten web specs `IMPLEMENTED`. Backend 423 tests, frontend 49.
