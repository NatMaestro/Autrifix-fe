/**
 * Typed surface over the backend's OpenAPI schema.
 *
 * `lib/api-types.ts` is **generated** — never edit it. Regenerate with `npm run api:gen`
 * after any backend contract change. This module is the hand-written ergonomic layer on
 * top: short aliases, and the few request/response shapes that are awkward to spell inline.
 *
 * Why this exists at all: before it, `services/` carried hand-written types that had
 * silently drifted from the API. `tsc` passed cleanly while six endpoints 404'd and the
 * registration payload sent a role the backend had stopped accepting — because TypeScript
 * was faithfully checking types that lied. Anchoring to the generated schema turns that
 * class of drift into a compile error instead of a runtime failure nobody sees until QA.
 */

import type { components, paths } from "@/lib/api-types";

export type Schemas = components["schemas"];
export type Paths = paths;

// --- domain vocabulary -------------------------------------------------------------
//
// Settled by backend ADR-020: a person needing help is a `customer`, a person doing the
// work is a `provider`. The word `mechanic` survives only as a *trade*
// (`ProviderTypeEnum` = mechanic | tow | both), never as a role — the platform also
// serves tow operators.

export type UserRole = Schemas["UserRoleEnum"];
export type SignupRole = Schemas["SignupRoleEnum"];
export type ProviderType = Schemas["ProviderTypeEnum"];
export type VerificationLevel = Schemas["VerificationLevelEnum"];

// --- core entities -----------------------------------------------------------------

export type User = Schemas["User"];
export type CustomerProfile = Schemas["CustomerProfile"];
export type ProviderProfile = Schemas["ProviderProfile"];
export type Vehicle = Schemas["Vehicle"];
export type ServiceCategoryMini = Schemas["ServiceCategoryMini"];
export type ServiceRequest = Schemas["ServiceRequest"];
/**
 * Write shape. Asymmetric with the read shape on purpose: `category` is a UUID going in
 * and the whole category object coming back, which the backend now declares per direction.
 */
export type ServiceRequestInput = Schemas["ServiceRequestRequest"];
export type Job = Schemas["Job"];
export type JobStatus = Schemas["JobStatusEnum"];
export type Quote = Schemas["Quote"];
export type ChatRoom = Schemas["ChatRoom"];
export type ChatMessage = Schemas["ChatMessage"];
export type Notification = Schemas["Notification"];
export type Review = Schemas["Review"];
export type ProviderServiceOffering = Schemas["ProviderServiceOffering"];
export type Agency = Schemas["Agency"];
export type AgencyMembership = Schemas["AgencyMembership"];

// --- pagination --------------------------------------------------------------------

/**
 * DRF's paginated envelope. Several endpoints are unpaginated by design
 * (`/jobs/requests/nearby/`, `/providers/memberships/`), so callers must not assume
 * `results` is always present — `unwrapList` below handles both.
 */
export type Paginated<T> = {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
};

/** Accept either a bare array or a DRF page, and always return an array. */
export function unwrapList<T>(data: T[] | Paginated<T> | null | undefined): T[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray((data as Paginated<T>).results)) {
    return (data as Paginated<T>).results;
  }
  return [];
}


// --- display helpers ---------------------------------------------------------------

const JOB_STATUS_LABELS: Record<string, string> = {
  pending_accept: "Pending",
  active: "In progress",
  awaiting_confirmation: "Awaiting your confirmation",
  completed: "Completed",
  cancelled: "Cancelled",
};

/**
 * Human label for a job status.
 *
 * `status` is optional in the schema because the backend supplies a default, so every call
 * site had to guard it. Centralised here rather than repeating `job.status?.replace(...)`,
 * which also silently mislabels `awaiting_confirmation` as "awaiting confirmation" when
 * what the customer needs to read is that *they* are the one being waited on.
 */
export function jobStatusLabel(status?: JobStatus | null): string {
  if (!status) return "Unknown";
  return JOB_STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

/** True while the provider has finished and the customer has not yet agreed. */
export function isAwaitingCustomer(job: Pick<Job, "status">): boolean {
  return job.status === "awaiting_confirmation";
}
