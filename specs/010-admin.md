# SPEC-WEB-010 — Administration

**Status:** IMPLEMENTED
**Scope:** Web
**Last synchronized with code:** 2026-09-01

## 1. Current state

Wired to the real operator API on 2026-09-01 (backend ADR-024). All five routes read live
data; the prototype banner is gone.

They were previously hardcoded arrays — `/admin/verifications` listed fabricated applicants
from "San Francisco, CA" and "Austin, TX", and `/admin/status` reported "Payments: Degraded"
for a payments system that does not exist, which reads as a broken subsystem rather than an
absent one.

## 2. Requirements

- **WEB-010-1** — Do not present admin routes as functional until a backend exists.
  **IMPLEMENTED 2026-09-01**: every page under `/admin` carries a persistent banner stating
  that the area is not connected, nothing is real, and Django admin is the live surface.
  Chosen over deleting the routes, which would discard design work that will be needed when
  SPEC-012 lands.
- **WEB-010-2** — Verification review first. **IMPLEMENTED**: `/admin/verifications` shows
  the queue oldest-first, requires a reason to decline, and renders no documents — those stay
  in Django admin (OQ-012-I).
- **WEB-010-3** — Admin reads of private data must be visible as such. **N/A here**: the
  operator API exposes no chat at all, so this surface does not widen SEC-GAP-34.
- **WEB-010-4** — `/admin` leads with work waiting on a person (pending verifications) rather
  than vanity counts, and flags jobs closed by timeout — each one a customer charged without
  agreeing.
- **WEB-010-5** — `/admin/status` reports one real check and states plainly that dispatch and
  payments are *absent by design*, not degraded.
- **WEB-010-6** — `/admin/users` and `/admin/history` are read-only. Editing stays in Django
  admin until scoped operator roles exist (OQ-012-B).

## 5. Open questions

**OQ-W010-A — Should these routes ship at all before SPEC-012?** — **ANSWERED 2026-09-01.**
They ship, with a prototype banner. Revisit if anyone outside the team gains an admin account,
at which point a banner stops being sufficient and the routes should be gated on a flag.

**OQ-W010-B — Who counts as an operator?**
Still open (backend OQ-012-B). `role=admin` remains all-or-nothing. Verification review,
dispute handling, and user administration plausibly want different people, and this surface
grants all of them together.

## 6. Related

Backend SPEC-012 (DEFERRED, ADR-017), SPEC-013, SEC-GAP-17/29/34.
