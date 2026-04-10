import { api } from "@/lib/api";

export async function nearbyServices(params: {
  lat: number;
  lng: number;
  radius_km?: number;
}) {
  const { data } = await api.get("/services/nearby/", { params });
  return data;
}
