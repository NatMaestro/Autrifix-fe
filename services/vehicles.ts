import { api } from "@/lib/api";
import { unwrapList, type Paginated, type Vehicle } from "@/lib/api-schema";

export type { Vehicle };

/**
 * Vehicles live under `/customers/` — the owner is a customer, not a "driver". The old
 * `/drivers/vehicles/` paths 404 (backend ADR-020).
 */
export async function listVehicles() {
  const { data } = await api.get<Paginated<Vehicle> | Vehicle[]>("/customers/vehicles/");
  return unwrapList(data);
}

export async function createVehicle(body: Partial<Vehicle> & Pick<Vehicle, "make" | "model">) {
  const { data } = await api.post<Vehicle>("/customers/vehicles/", body);
  return data;
}

export async function updateVehicle(id: string, body: Partial<Vehicle>) {
  const { data } = await api.patch<Vehicle>(`/customers/vehicles/${id}/`, body);
  return data;
}

export async function deleteVehicle(id: string) {
  await api.delete(`/customers/vehicles/${id}/`);
}
