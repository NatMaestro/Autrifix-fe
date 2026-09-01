import { api } from "@/lib/api";

import type { ServiceCategoryMini } from "@/lib/api-schema";

export type ServiceCategory = ServiceCategoryMini;

export type IssueRouteResponse = {
  category_id: string | null;
  category_slug: string | null;
  confidence: number;
  method: "rules" | "ml" | "fallback" | "none";
  reason: string;
};

export type NearbyProviderPreview = {
  id: string;
  business_name: string;
  latitude: number;
  longitude: number;
  rating_avg: number;
  rating_count: number;
  distance_km: number;
};

export type NearbyServicesResponse = {
  categories: ServiceCategory[];
  nearby_providers_count: number;
  radius_km: number;
  providers: NearbyProviderPreview[];
  /** The backend caps results at 50. When true, there are more than are shown. */
  truncated: boolean;
};

export async function nearbyServices(params: {
  lat: number;
  lng: number;
  radius_km?: number;
}) {
  const { data } = await api.get<Partial<NearbyServicesResponse>>("/services/nearby/", { params });
  return {
    categories: Array.isArray(data?.categories) ? data.categories : [],
    nearby_providers_count: Number(data?.nearby_providers_count ?? 0),
    // Was discarded, so a capped result set looked like the complete picture.
    truncated: Boolean(data?.truncated),
    radius_km: Number(data?.radius_km ?? params.radius_km ?? 25),
    providers: Array.isArray(data?.providers) ? data.providers : [],
  } satisfies NearbyServicesResponse;
}

export async function listServiceCategories() {
  const { data } = await api.get<ServiceCategory[] | { results?: ServiceCategory[] | null }>("/jobs/categories/");
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

/** Look up a routed category so the client can honour flags like `requires_destination`. */
export async function findCategory(categoryId: string) {
  const categories = await listServiceCategories();
  return categories.find((c) => c.id === categoryId) ?? null;
}

export async function routeIssue(issueText: string) {
  const { data } = await api.post<IssueRouteResponse>("/ai/route-issue/", {
    issue_text: issueText,
  });
  return data;
}
