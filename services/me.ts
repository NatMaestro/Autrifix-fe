import { api } from "@/lib/api";

import type { AuthUser } from "@/store/auth-store";

export async function fetchMe() {
  const { data } = await api.get<AuthUser>("/me/");
  return data;
}

export async function patchMe(body: Partial<{
  first_name: string;
  last_name: string;
  role: "driver" | "mechanic";
  email: string | null;
}>) {
  const { data } = await api.patch<AuthUser>("/me/", body);
  return data;
}

export async function patchDriverProfile(body: { display_name?: string }) {
  const { data } = await api.patch("/drivers/profile/", body);
  return data;
}

export async function patchMechanicProfile(body: { business_name?: string; bio?: string }) {
  const { data } = await api.patch("/mechanics/profile/", body);
  return data;
}
