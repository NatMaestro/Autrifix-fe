# SPEC-WEB-006 — Job Management

**Status:** IMPLEMENTED
**Scope:** Web
**Last synchronized with code:** 2026-09-01

## 1. Purpose

The shared lifecycle between customer and provider, from claim to confirmed completion.

## 2. The lifecycle the client must model

```text
pending_accept ──> active ──> awaiting_confirmation ──> completed
   (provider)     (provider,          (customer only)
                  records amount)
```

**Completion is two-sided (backend ADR-022).** A provider records what is owed and the job
moves to `awaiting_confirmation`; only the customer can close it. `active → completed` does
not exist and returns `409`.

## 3. Requirements

### WEB-006-1 — Provider starts a job
**Status:** IMPLEMENTED — `startJob()` → `PATCH {status: "active"}`.

### WEB-006-2 — Provider finishes and records an amount
**Status:** IMPLEMENTED (2026-08-31)

`/provider/job/[id]` shows an amount field while the job is `active` and calls `finishJob()`
with `status: "awaiting_confirmation"` plus `final_amount`. The button previously sent
`status: "completed"`, which the backend now refuses.

### WEB-006-3 — Customer confirms the amount
**Status:** IMPLEMENTED (2026-09-01)

`components/jobs/job-money-panel.tsx` renders on both customer live-job routes
(`/customer/track` and `/customer/in-progress`, since chat links to one and matching to the
other). It shows the recorded amount, the variance against any accepted quote, and a confirm
action that calls `confirmJob()`.

Both pages previously excluded `awaiting_confirmation` from their live-job lookup, so the one
state needing the customer's attention was the one state they could not find.

### WEB-006-4 — Quotes
**Status:** IMPLEMENTED (2026-09-01)

`components/jobs/provider-quote-panel.tsx` on `/provider/job/[id]` submits and revises;
`job-money-panel.tsx` gives the customer accept/decline. Quoting stays optional, and the UI
says so — a tow price is computable up front and a small job is not worth the round trip.

Declining is labelled as inviting a revision rather than cancelling, matching the backend.

### WEB-006-5 — Amount variance is disclosed before confirming
**Status:** IMPLEMENTED (2026-09-01)

When the recorded amount exceeds an accepted quote, the confirm panel shows the difference in
an amber callout and suggests asking the provider about it first. The backend discloses
rather than clamps, because a repair can turn up something nobody could foresee — so the
customer needs the comparison, not a silent adjustment.

### WEB-006-6 — Cancellation
**Status:** PARTIAL

`cancelJob()` is wired on the provider side. The customer's `cancelRequest()` is not called
anywhere, and the `409` for cancelling finished-but-unconfirmed work is unhandled.

## 4. Remaining gaps

1. **Nothing notifies the customer that they are the blocker.** The backend emits
   `job.awaiting_confirmation`, and the web app consumes no notifications at all
   (SPEC-WEB-008). The confirm panel exists but relies on the customer returning to the app
   unprompted — so auto-confirmation (SPEC-016 REQ-2) may still close jobs against people who
   simply never saw the request.
2. The customer's `cancelRequest()` is still called from nowhere.
3. `/customer/completed` still renders from local state rather than `/jobs/`.

## 5. Open questions

**OQ-W006-A — Where does the customer confirm?** — **ANSWERED 2026-09-01.**
A panel on the existing live-job routes rather than a separate screen: the job is still the
thing the customer is watching, and a dedicated route would need to be navigated to. It shows
amount, accepted quote, and variance together, since the number alone is not enough to agree
to. Revisit if notifications land and a deep-linked confirm screen becomes worthwhile.

**OQ-W006-B — Should the customer be able to dispute in-product?**
The backend has no dispute state (SPEC-015 OQ-015-E); a customer who disagrees simply does
not confirm, and auto-confirmation then closes the job against them. That is a poor outcome
with no UI affordance to avoid it.

## 6. Related

Backend SPEC-007, SPEC-015 (money model), SPEC-016 (auto-confirmation).

**Verification:** the whole sequence is walked in the backend's
`tests/test_money_flow_end_to_end.py` (3), in the order the client performs it — request,
claim, quote, accept, start, finish, disclose variance, confirm. If that test breaks, a
screen here breaks with it.
