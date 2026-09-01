import { api } from "@/lib/api";
import { unwrapList, type Paginated, type Schemas } from "@/lib/api-schema";

export type AdminStats = Schemas["AdminStatsResponse"];
export type AdminUser = Schemas["AdminUser"];
export type AdminJob = Schemas["AdminJob"];
export type AdminVerification = Schemas["AdminVerification"];

export async function getStats() {
  const { data } = await api.get<AdminStats>("/admin/stats/");
  return data;
}

export async function listUsers(params?: { q?: string; role?: string }) {
  const { data } = await api.get<Paginated<AdminUser> | AdminUser[]>("/admin/users/", {
    params,
  });
  return unwrapList(data);
}

export async function listAdminJobs(params?: { status?: string }) {
  const { data } = await api.get<Paginated<AdminJob> | AdminJob[]>("/admin/jobs/", { params });
  return unwrapList(data);
}

/** Defaults to the pending queue — the only view that represents outstanding work. */
export async function listVerifications(params?: { status?: string }) {
  const { data } = await api.get<Paginated<AdminVerification> | AdminVerification[]>(
    "/admin/verifications/",
    { params },
  );
  return unwrapList(data);
}

/**
 * Approve or decline a submission.
 *
 * `notes` is mandatory on a decline: the provider is shown it, and a refusal without a reason
 * leaves them unable to fix anything.
 */
export async function reviewVerification(
  id: string,
  input: { approve: boolean; notes?: string },
) {
  const { data } = await api.post<AdminVerification>(
    `/admin/verifications/${id}/review/`,
    { approve: input.approve, notes: input.notes ?? "" },
  );
  return data;
}
