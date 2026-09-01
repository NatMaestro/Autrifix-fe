import { api } from "@/lib/api";
import {
  unwrapList,
  type Job,
  type Paginated,
  type Quote,
  type ServiceRequest,
  type ServiceRequestInput,
} from "@/lib/api-schema";

export type { Job, Quote, ServiceRequest, ServiceRequestInput };

/** A request as it appears in the provider's discovery feed. */
export type NearbyRequestItem = ServiceRequest;

/**
 * List jobs the caller is a party to. Paginated by the backend; `unwrapList` tolerates
 * both shapes so a pagination change on the server cannot silently empty the UI.
 */
export async function listJobs() {
  const { data } = await api.get<Paginated<Job> | Job[]>("/jobs/");
  return unwrapList(data);
}

/**
 * Create a service request.
 *
 * Uses `/jobs/requests/` rather than the legacy `/requests/create/` duplicate, which the
 * backend's API docs flag for removal.
 *
 * Returns `409` when the customer is already at `MAX_OPEN_REQUESTS_PER_CUSTOMER`
 * (backend SPEC-016 REQ-4) — callers should surface that as a message, not a crash.
 */
export async function createRequest(body: ServiceRequestInput) {
  const { data } = await api.post<ServiceRequest>("/jobs/requests/", body);
  return data;
}

export async function listRequests() {
  const { data } = await api.get<Paginated<ServiceRequest> | ServiceRequest[]>("/jobs/requests/");
  return unwrapList(data);
}

export async function getRequest(id: string) {
  const { data } = await api.get<ServiceRequest>(`/jobs/requests/${id}/`);
  return data;
}

/** `409` once the request is terminal, or while a job on it is `awaiting_confirmation`. */
export async function cancelRequest(id: string) {
  const { data } = await api.post<ServiceRequest>(`/jobs/requests/${id}/cancel/`);
  return data;
}

/**
 * Open requests near the provider, unpaginated and capped at 50 by the backend.
 *
 * Coordinates are **snapped to a ~1 km grid** for providers below
 * `PROVIDER_EXACT_LOCATION_MIN_LEVEL`, with `distance_km` derived from the snapped point
 * (backend SPEC-013 REQ-2). Treat these as approximate until the job is accepted.
 */
export async function listNearbyOpenRequests(lat: number, lng: number, radiusKm = 50) {
  const { data } = await api.get<ServiceRequest[]>("/jobs/requests/nearby/", {
    params: { lat, lng, radius_km: radiusKm },
  });
  return unwrapList(data);
}

/**
 * Claim an open request.
 *
 * Three distinct failures the UI must tell apart:
 * - `409` — already claimed, expired, or the provider is at their concurrent-job cap
 * - `403` with `verification_required` — below `PROVIDER_MIN_ACCEPT_LEVEL`; the body carries
 *   `current_level`, `required_level`, and `verification_url` so the UI can route them there
 */
export async function acceptJob(requestId: string) {
  const { data } = await api.post<Job>(`/jobs/requests/${requestId}/accept/`);
  return data;
}

export async function getJob(id: string) {
  const { data } = await api.get<Job>(`/jobs/${id}/`);
  return data;
}

/** Provider-only working notes. A customer may read them but not write them. */
export async function patchJobNotes(id: string, notes: string) {
  const { data } = await api.patch<Job>(`/jobs/${id}/`, { notes });
  return data;
}

/** Provider starts work they accepted. */
export async function startJob(id: string) {
  const { data } = await api.patch<Job>(`/jobs/${id}/`, { status: "active" });
  return data;
}

/**
 * Provider finishes and records what the customer owes.
 *
 * This does **not** complete the job — it moves to `awaiting_confirmation` and waits on the
 * customer (backend ADR-022). `final_amount` is mandatory here and is rejected on any other
 * transition, so the amount can never be revised after the customer has seen it.
 */
export async function finishJob(id: string, finalAmount: string) {
  const { data } = await api.patch<Job>(`/jobs/${id}/`, {
    status: "awaiting_confirmation",
    final_amount: finalAmount,
  });
  return data;
}

/**
 * Customer agrees to the amount, closing the job.
 *
 * Only the customer can do this — a provider sending `completed` gets a `409`. If the
 * customer never confirms, the backend auto-confirms after its configured window and marks
 * the job accordingly (SPEC-016 REQ-2).
 */
export async function confirmJob(id: string) {
  const { data } = await api.patch<Job>(`/jobs/${id}/`, { status: "completed" });
  return data;
}

export async function cancelJob(id: string) {
  const { data } = await api.patch<Job>(`/jobs/${id}/`, { status: "cancelled" });
  return data;
}

// --- quotes -------------------------------------------------------------------------

/**
 * Quoting is optional by design: a tow price falls out of per-km × distance, while a repair
 * cost is not knowable until someone looks. Where an accepted quote exists, the job's
 * `amount_variance` reports how far the final amount landed from it.
 */
export async function listQuotes(jobId: string) {
  const { data } = await api.get<Paginated<Quote> | Quote[]>(`/jobs/${jobId}/quotes/`);
  return unwrapList(data);
}

/** Provider-only. A new quote supersedes any outstanding one. */
export async function submitQuote(jobId: string, amount: string, notes = "") {
  const { data } = await api.post<Quote>(`/jobs/${jobId}/quotes/`, { amount, notes });
  return data;
}

/** Customer-only. Declining invites a revised quote; it does not cancel the job. */
export async function respondToQuote(jobId: string, quoteId: string, accept: boolean) {
  const { data } = await api.post<Quote>(`/jobs/${jobId}/quotes/${quoteId}/respond/`, { accept });
  return data;
}
