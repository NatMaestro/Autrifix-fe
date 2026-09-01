# Web Specifications

Feature specs should describe the user experience and the API interactions needed to support it.

For each feature document:

- user role;
- entry point;
- route/page;
- UI states;
- interaction flow;
- permissions;
- API calls;
- validation;
- responsive behavior;
- accessibility;
- acceptance criteria;
- tests.

Backend behavior belongs in backend specs; cross-platform requirements should be referenced rather than duplicated.


## Index

Synchronized with the codebase on 2026-09-01 — see [docs/SYNC-REPORT.md](../docs/SYNC-REPORT.md).

| Spec | Area | Status |
|---|---|---|
| [001](001-authentication.md) | Authentication & account access | IMPLEMENTED |
| [002](002-customer-dashboard.md) | Customer dashboard | IMPLEMENTED |
| [003](003-service-request.md) | Service request experience | IMPLEMENTED |
| [004](004-vehicle-management.md) | Vehicle management | IMPLEMENTED |
| [005](005-mechanic-dashboard.md) | Provider dashboard | IMPLEMENTED |
| [006](006-job-management.md) | Job management | IMPLEMENTED |
| [007](007-messaging.md) | Messaging | IMPLEMENTED |
| [008](008-notifications.md) | Notifications | IMPLEMENTED |
| [009](009-ratings-reviews.md) | Ratings & reviews | IMPLEMENTED |
| [010](010-admin.md) | Administration | IMPLEMENTED |

**Testing began 2026-09-01** (ADR-005): Vitest + Testing Library, 34 tests, run in CI
alongside typecheck, lint, build, and a check that the generated API types match the backend.

Statuses stay at `IMPLEMENTED` rather than `VERIFIED`. Coverage is real but narrow — the
contract helpers and the two components that gate outcomes (`JobMoneyPanel`,
`VerificationPanel`). Claiming `VERIFIED` under CLAUDE.md §10 would need each spec's
acceptance criteria actually exercised, which they are not yet.

The filename `005-mechanic-dashboard.md` is kept although the subject is a *provider*: spec
numbers are stable identifiers (CLAUDE.md §6) and renaming the file would break every
reference to it.
