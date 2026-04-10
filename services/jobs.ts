import { api } from "@/lib/api";

/** List jobs — shape depends on backend; typed loosely for UI. */
export async function listJobs() {
  const { data } = await api.get("/jobs/");
  return data as unknown;
}

export async function createRequest(body: Record<string, unknown>) {
  const { data } = await api.post("/requests/create/", body);
  return data;
}

export async function acceptJob(requestId: string) {
  const { data } = await api.post(`/jobs/requests/${requestId}/accept/`);
  return data;
}
