import { api } from "@/lib/api";

export type MechanicProfileDto = {
  id: string;
  business_name: string;
  bio: string;
  base_latitude?: number | null;
  base_longitude?: number | null;
  service_radius_km: number;
  is_available: boolean;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
};

export type MechanicServiceOfferingDto = {
  id: string;
  category: string;
  category_name?: string;
  category_slug?: string;
  title: string;
  description: string;
  hourly_rate: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function getMechanicProfile() {
  const { data } = await api.get<MechanicProfileDto>("/mechanics/profile/");
  return data;
}

export async function patchMechanicProfile(
  body: Partial<
    Pick<
      MechanicProfileDto,
      "business_name" | "bio" | "service_radius_km" | "base_latitude" | "base_longitude"
    >
  >,
) {
  const { data } = await api.patch<MechanicProfileDto>("/mechanics/profile/", body);
  return data;
}

export async function listMechanicServices() {
  const { data } = await api.get<MechanicServiceOfferingDto[] | { results?: MechanicServiceOfferingDto[] | null }>(
    "/mechanics/services/",
  );
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export async function createMechanicService(body: {
  category: string;
  title?: string;
  description?: string;
  hourly_rate?: string | null;
}) {
  const { data } = await api.post<MechanicServiceOfferingDto>("/mechanics/services/", body);
  return data;
}

export async function patchMechanicService(
  id: string,
  body: Partial<Pick<MechanicServiceOfferingDto, "title" | "description" | "hourly_rate" | "is_active">>,
) {
  const { data } = await api.patch<MechanicServiceOfferingDto>(`/mechanics/services/${id}/`, body);
  return data;
}

export async function deleteMechanicService(id: string) {
  await api.delete(`/mechanics/services/${id}/`);
}
