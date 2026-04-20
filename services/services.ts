import { api } from "@/lib/api";

export type ServiceCategory = {
  id: string;
  name?: string;
  slug?: string;
};

export type IssueRouteResponse = {
  category_id: string | null;
  category_slug: string | null;
  confidence: number;
  method: "rules" | "ml" | "fallback" | "none";
  reason: string;
};

export type NearbyMechanicPreview = {
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
  nearby_mechanics_count: number;
  radius_km: number;
  mechanics: NearbyMechanicPreview[];
};

export async function nearbyServices(params: {
  lat: number;
  lng: number;
  radius_km?: number;
}) {
  const { data } = await api.get<Partial<NearbyServicesResponse>>("/services/nearby/", { params });
  return {
    categories: Array.isArray(data?.categories) ? data.categories : [],
    nearby_mechanics_count: Number(data?.nearby_mechanics_count ?? 0),
    radius_km: Number(data?.radius_km ?? params.radius_km ?? 25),
    mechanics: Array.isArray(data?.mechanics) ? data.mechanics : [],
  } satisfies NearbyServicesResponse;
}

export async function listServiceCategories() {
  const { data } = await api.get<ServiceCategory[] | { results?: ServiceCategory[] | null }>("/jobs/categories/");
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export async function routeIssue(issueText: string) {
  const { data } = await api.post<IssueRouteResponse>("/ai/route-issue/", {
    issue_text: issueText,
  });
  return data;
}
