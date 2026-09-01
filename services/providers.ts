/**
 * Service-provider profile and offerings.
 *
 * Renamed from `services/mechanics.ts`. A mechanic is a **trade**, not a role: the
 * platform also serves tow operators, and a tow operator is emphatically not a mechanic
 * (backend ADR-020). The trade now lives on `ProviderProfile.provider_type`.
 */

import { api } from "@/lib/api";
import {
  unwrapList,
  type Paginated,
  type ProviderProfile,
  type ProviderServiceOffering,
} from "@/lib/api-schema";

export type { ProviderProfile, ProviderServiceOffering };

export async function getProviderProfile() {
  const { data } = await api.get<ProviderProfile>("/providers/profile/");
  return data;
}

export async function patchProviderProfile(
  body: Partial<
    Pick<
      ProviderProfile,
      | "business_name"
      | "bio"
      | "service_radius_km"
      | "base_latitude"
      | "base_longitude"
      | "is_available"
      | "provider_type"
    >
  >,
) {
  const { data } = await api.patch<ProviderProfile>("/providers/profile/", body);
  return data;
}

export async function listProviderServices() {
  const { data } = await api.get<Paginated<ProviderServiceOffering> | ProviderServiceOffering[]>(
    "/providers/services/",
  );
  return unwrapList(data);
}

/**
 * Declare coverage of a service category.
 *
 * Offerings do **not** gate which requests a provider sees (backend ADR-009), but they do
 * count toward profile completeness for phone-level verification.
 */
export async function createProviderService(body: {
  category: string;
  title?: string;
  description?: string;
  hourly_rate?: string | null;
  per_km_rate?: string | null;
}) {
  const { data } = await api.post<ProviderServiceOffering>("/providers/services/", body);
  return data;
}

export async function patchProviderService(
  id: string,
  body: Partial<
    Pick<
      ProviderServiceOffering,
      "title" | "description" | "hourly_rate" | "per_km_rate" | "is_active"
    >
  >,
) {
  const { data } = await api.patch<ProviderServiceOffering>(`/providers/services/${id}/`, body);
  return data;
}

export async function deleteProviderService(id: string) {
  await api.delete(`/providers/services/${id}/`);
}
