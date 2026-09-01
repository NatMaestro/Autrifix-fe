# SPEC-WEB-009 — Ratings & Reviews

**Status:** IMPLEMENTED
**Scope:** Web
**Last synchronized with code:** 2026-09-01

## 1. Current state

Implemented 2026-09-01. `services/reviews.ts` posts to `/reviews/`, and `/customer/rate`
reads the real job, submits for real, and reports failure honestly.

**It previously showed `toast.success("Thanks — review queued (POST /reviews/)")` and sent
nothing** — a defect rather than a missing feature, because the customer was told something
untrue and the provider would never receive the review. The page also hardcoded a provider
name and "Service complete"; both now come from the job.

## 2. What the backend provides

`POST /reviews/` — written by the job's **customer**, about a **completed** job only, 1–5
stars plus an optional comment, unique per `(job, author)`. Provider `rating_avg` and
`rating_count` are maintained on save and delete.

Since completion now means *customer-confirmed*, the precondition is strictly stronger than
before: a review can only exist for work the customer agreed was done.

## 3. Requirements

- **WEB-009-1** — `services/reviews.ts` with create and list. **IMPLEMENTED**
- **WEB-009-2** — `/customer/rate` posts for real and reports failure honestly. **IMPLEMENTED**
- **WEB-009-3** — Only `completed` jobs are offered; the page selects from those. **IMPLEMENTED**
- **WEB-009-4** — A duplicate reads as "You have already reviewed this job." **IMPLEMENTED**
- **WEB-009-5** — Provider rating is still displayed nowhere. **NOT IMPLEMENTED** — see
  OQ-W009-A.

The UI's quick tags have no API field, so they are folded into the comment rather than
silently discarded.

## 4. Open questions

**OQ-W009-A — Where is a provider's reputation shown to a customer?**
Ratings are computed and never surfaced, so they currently influence no decision. The nearby
providers list is the obvious place.

**OQ-W009-B — Should a job auto-confirmed by timeout be reviewable?**
The customer never actively agreed the work was done. Backend allows it; whether it should is
undecided.

## 5. Related

Backend SPEC-011, ADR-011.
