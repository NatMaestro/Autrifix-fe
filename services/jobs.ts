import { api } from "@/lib/api";

export type ServiceRequestResult = {
  id: string;
  status: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
};

export type ServiceCategoryMini = {
  id: string;
  name: string;
  slug: string;
};

export type NearbyRequestItem = {
  id: string;
  category: ServiceCategoryMini | string;
  description: string;
  latitude: number;
  longitude: number;
  status: string;
  driver_name?: string | null;
  vehicle_summary?: string | null;
  created_at: string;
};

export type JobListItem = {
  id: string;
  service_request: string;
  mechanic?: string;
  mechanic_name?: string | null;
  driver_name?: string | null;
  service_category_name?: string | null;
  status: string;
  created_at?: string;
  completed_at?: string | null;
};

/** List jobs — shape depends on backend; typed loosely for UI. */
export async function listJobs() {
  const { data } = await api.get<JobListItem[] | { results?: JobListItem[] | null }>("/jobs/");
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export async function createRequest(body: Record<string, unknown>) {
  const { data } = await api.post<ServiceRequestResult>("/requests/create/", body);
  return data;
}

export async function listNearbyOpenRequests(lat: number, lng: number, radiusKm = 50) {
  const { data } = await api.get<NearbyRequestItem[]>("/jobs/requests/nearby/", {
    params: { lat, lng, radius_km: radiusKm },
  });
  return Array.isArray(data) ? data : [];
}

export async function acceptJob(requestId: string) {
  const { data } = await api.post(`/jobs/requests/${requestId}/accept/`);
  return data;
}

export async function getJob(id: string) {
  const { data } = await api.get<JobListItem>(`/jobs/${id}/`);
  return data;
}

export async function patchJob(id: string, body: Partial<Pick<JobListItem, "status">> & { notes?: string }) {
  const { data } = await api.patch<JobListItem>(`/jobs/${id}/`, body);
  return data;
}
