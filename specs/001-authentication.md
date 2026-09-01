# SPEC-WEB-001 — Authentication & Account Access

**Status:** IMPLEMENTED
**Scope:** Web
**Last synchronized with code:** 2026-09-01

## 1. Purpose

How a person signs in, signs up, and lands on the right side of the product.

## 2. Routes

| Route | Purpose | State |
|---|---|---|
| `/auth/login` | Password sign-in + Google | Implemented |
| `/auth/register` | Password sign-up + Google, with role choice | Implemented |
| `/auth/profile` | Name capture after signup | Implemented |
| `/auth/phone`, `/auth/otp` | **Deprecated** — permanent redirects to `/auth/login` | SMS OTP is off for MVP |

## 3. Requirements

### WEB-001-1 — Three sign-in paths, one session
**Status:** IMPLEMENTED

Password (`/auth/login/`), Google ID token (`/auth/google/`), and phone OTP
(`/auth/verify-otp/`). Tokens land in a persisted Zustand store (`store/auth-store.ts`);
`lib/api.ts` attaches the access token and refreshes once on `401`, de-duplicating concurrent
refreshes through a single shared promise.

**Evidence:** `services/auth.ts`, `lib/api.ts`, `store/auth-store.ts`.

### WEB-001-2 — Anonymous endpoints must not carry a stale token
**Status:** IMPLEMENTED

`shouldAttachAuth` in `lib/api.ts` strips `Authorization` from the auth endpoints. A stale
JWT would otherwise be rejected by `JWTAuthentication` before the `AllowAny` view runs,
turning a valid sign-in attempt into a 401.

### WEB-001-3 — Role is chosen before the account exists
**Status:** IMPLEMENTED (2026-09-01)

Role is permanent (backend ADR-013), so it is never assigned by default. `/auth/register`
passes the chosen role to both password and Google signup. On `/auth/login`, a first-time
Google user triggers `signup_role_required` from the backend; the page then shows a role
prompt and retries with the same credential.

**This closed a live defect**: before it, a provider signing in with Google was silently
created as a customer, permanently, with no error. See backend ADR-023.

### WEB-001-4 — Role is displayed, never edited
**Status:** IMPLEMENTED

`/auth/profile` shows the account type read-only. It previously offered a picker that the API
silently ignored (CONFLICT-W001-A, resolved).

### WEB-001-5 — Post-auth routing follows role
**Status:** IMPLEMENTED

`provider` → `/provider`, everyone else → `/customer`.

## 4. Gaps

- **No route guard.** `/customer/*` and `/provider/*` do not verify role on entry; a customer
  navigating to `/provider` sees the provider shell and fails at the API layer. See OQ-W001-A.
- **Demo bypass in production code.** `ENABLE_OTP_BYPASS` and `demo-access-` token prefixes
  short-circuit real calls in `/auth/profile`. Guarded by an env flag, but the branch ships.
- **No test covers any of this.** There is no test framework in the project at all.

## 5. Open questions

**OQ-W001-A — Should route groups enforce role client-side?**
Server authorization is already correct, so this is a UX question, not a security one: is
seeing the wrong shell before an error acceptable, or should the layout redirect?

**OQ-W001-B — Is the demo bypass still needed?**
It exists so the UI can be exercised without a backend. Now that the backend is complete, it
may be dead weight that only adds a path where the app lies about what happened.

## 6. Related

Backend SPEC-001, ADR-013 (role read-only), ADR-023 (no default role at signup).
