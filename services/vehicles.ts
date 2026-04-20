import { api } from "@/lib/api";

import type { VehicleDto } from "@/lib/vehicle-profile";

type VehicleListResponse = VehicleDto[] | { results?: VehicleDto[] | null };

export async function listVehicles() {
  const { data } = await api.get<VehicleListResponse>("/drivers/vehicles/");
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export async function createVehicle(body: Partial<VehicleDto> & Pick<VehicleDto, "make" | "model">) {
  const { data } = await api.post<VehicleDto>("/drivers/vehicles/", body);
  return data;
}

export async function updateVehicle(id: string, body: Partial<VehicleDto>) {
  const { data } = await api.patch<VehicleDto>(`/drivers/vehicles/${id}/`, body);
  return data;
}

export async function deleteVehicle(id: string) {
  await api.delete(`/drivers/vehicles/${id}/`);
}
