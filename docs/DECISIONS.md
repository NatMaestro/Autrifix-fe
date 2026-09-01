# Autrifix Web Decisions

### ADR-001 — Backend Contract as Server Authority

**Status:** Accepted

The Next.js client consumes explicit backend contracts. Client-side assumptions must not redefine server-side business rules.

### ADR-002 — SDD Adoption

**Status:** Accepted

Significant UI features are specified before implementation and reviewed against acceptance criteria.

### ADR-003 — Types are generated from the backend's OpenAPI schema

**Status:** Accepted (2026-08-31)

**Context:** `services/` carried hand-written TypeScript types for every API shape. They had
drifted badly from the backend and nothing could detect it: `tsc --noEmit` passed cleanly
while six endpoints returned 404, the registration payload sent a role the backend had
stopped accepting, and response fields like `mechanic_name` no longer existed. TypeScript
was faithfully checking types that lied.

**Decision:** The backend's schema is the source of truth. `openapi/schema.yml` is exported
from drf-spectacular and `lib/api-types.ts` is generated from it by `npm run api:gen`.
Neither file is edited by hand. `lib/api-schema.ts` is the hand-written ergonomic layer:
short aliases, pagination helpers, and display helpers.

**Consequences:**

- Backend contract changes become **compile errors** instead of runtime 404s. Adopting this
  immediately surfaced 67 type errors that had been invisible.
- Regenerating is now a step after any backend contract change. Forgetting it means stale
  types — the failure mode is the old one, so `api:gen` belongs in CI.
- **A generated type is only as honest as the annotation behind it.** This caught a backend
  bug rather than a frontend one: `ServiceRequest.category` was documented as a UUID while
  `to_representation` actually returned the whole object. Fixed in the backend with a
  direction-aware field extension rather than worked around here — a schema that lies is
  worse than no schema, because it is trusted.

### ADR-004 — Vocabulary and routes follow the backend

**Status:** Accepted (2026-08-31)

**Context:** Backend ADR-020 renamed `driver` → `customer` and `mechanic` → `provider`.
`driver` read like a rideshare app, and `mechanic` presumed a single trade when the platform
also serves tow operators.

**Decision:** The web app follows completely, including user-visible routes:
`/driver/*` → `/customer/*` and `/mechanic/*` → `/provider/*`. Permanent redirects preserve
any bookmarked or already-shared link.

**`mechanic` survives only as a trade** (`ProviderTypeEnum` = `mechanic | tow | both`), never
as a role — the same distinction the backend kept.

**Consequences:**

- 49 files rewritten. Two classes of near-miss are worth recording, both repeats of what the
  backend rename hit: the route-string rule `/mechanic` matched inside the prose
  "automotive/mechanical", and word boundaries do not span camelCase, so `driverName` and
  `patchMechanicProfile` needed explicit handling.
- Comments that deliberately *quote* the old vocabulary to explain the change were rewritten
  by the blanket pass and had to be repaired. A rename script needs protected tokens.

### CONFLICT-W001-A — The profile page offers a role picker the backend ignores

**Status:** RESOLVED (2026-09-01) — see backend ADR-023

`app/auth/profile/page.tsx` presents a customer/provider picker and sent `role` to
`PATCH /me/`. The backend makes `role` **read-only after signup** (ADR-013), so the value was
silently dropped: the picker appeared to work and never did.

The field is no longer sent, which changes no behaviour but stops the client asserting
something untrue. **The picker itself is still there**, and what it should do is a product
question with three plausible answers:

1. Remove it — role is set at signup, so this page is name-only.
2. Keep it and let it work — the backend would have to allow one role change, and decide what
   happens to a provider's jobs, verification, and agency membership when they become a
   customer.
3. Keep it as signup-only — show it when the account has no role yet, hide it otherwise.

Recorded rather than guessed, per CLAUDE.md §3.


### Resolution of CONFLICT-W001-A (2026-09-01)

Investigating this turned up something worse than the cosmetic issue first recorded: `role`
**defaults to `customer`** on every signup path when none is supplied. Combined with
read-only-after-signup (ADR-013), a provider signing in with Google became a customer
permanently and silently.

**Decided:** ask before the account exists. Backend ADR-023 makes both passwordless
endpoints refuse to create an account without an explicit role, returning
`signup_role_required`. The login page now shows a role prompt for a first-time Google user
and retries with the answer. The profile page's picker is gone, replaced by a read-only
display of the account type.

The rejected alternative — letting the role change once while the account is clean — would
have rescued mis-assigned users but left the silent default in place, and needed a rule for
what "clean" means across jobs, requests, verification, and agency membership.

### ADR-005 — Vitest for web tests, and CI that runs it

**Status:** Accepted (2026-09-01)

**Context:** The web app had **no test framework at all** — no vitest, jest, or playwright —
so no spec could reach `VERIFIED` under CLAUDE.md §10, and nothing caught regressions. The
same week, repairing ESLint surfaced 26 `react-hooks/rules-of-hooks` violations that had been
shipping in both chat pages: hooks called after an early return, which makes React throw
"rendered fewer hooks than expected". Code that looked fine, reviewed by eye, was broken.

**Decision:** Vitest with jsdom and Testing Library, plus a GitHub Actions workflow running
typecheck, lint, test, and build — and a second job that regenerates the API types from the
backend and fails if the committed ones are stale.

**What is tested, and why those things:** the hand-written layer over the generated types,
and the two components that gate real outcomes.

- `unwrapList`, `jobStatusLabel`, `notificationHref` — small functions that each encode a
  decision a rename could silently invert.
- `JobMoneyPanel` — the only route by which a job can be completed. If it stops rendering
  the confirm action, every finished job stalls until auto-confirmation closes it *against*
  the customer, with no error anywhere.
- `VerificationPanel` — the only route out of being blocked from accepting work.

Generated types are not tested; `tsc` already covers them.

**Alternatives considered:** Playwright end-to-end. Rejected for now — it needs both servers
running and a seeded database, and the backend already walks the full money flow in
`test_money_flow_end_to_end.py`. Component tests catch the class of bug actually seen here
(hook order, missing render branches) at a fraction of the cost. Revisit when a bug crosses
the client/server boundary in a way neither layer catches alone.

**Consequences:**

- 34 tests over three files. Specs can begin moving toward `VERIFIED`, though most would need
  more coverage than this to claim it honestly.
- `eslint.ignoreDuringBuilds` is now `false`. It was `true` because ESLint *crashed* —
  `@typescript-eslint/eslint-plugin` and `es-abstract` were truncated on disk, almost
  certainly by an `npm install` during the disk-full incident. A clean reinstall fixed it.
- `.gitattributes` normalizes line endings, or the CI drift check fails on CRLF-vs-LF rather
  than on real content.
