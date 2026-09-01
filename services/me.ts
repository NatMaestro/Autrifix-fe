import { api } from "@/lib/api";
import { API_BASE } from "@/lib/constants";

import type { CustomerProfile, ProviderProfile } from "@/lib/api-schema";
import type { AuthUser } from "@/store/auth-store";

function apiOrigin() {
  return API_BASE.replace(/\/api\/v1\/?$/, "");
}

function normalizeAvatarUrl(avatar?: string | null) {
  if (!avatar) return avatar ?? null;
  if (/^https?:\/\//i.test(avatar) || avatar.startsWith("data:") || avatar.startsWith("blob:")) return avatar;
  if (avatar.startsWith("/")) return `${apiOrigin()}${avatar}`;
  return `${apiOrigin()}/${avatar}`;
}

function normalizeUser(user: AuthUser): AuthUser {
  return { ...user, avatar: normalizeAvatarUrl(user.avatar) };
}

export async function getCustomerProfile() {
  const { data } = await api.get<CustomerProfile>("/customers/profile/");
  return data;
}

export async function fetchMe() {
  const { data } = await api.get<AuthUser>("/me/");
  return normalizeUser(data);
}

export async function patchMe(body: Partial<{
  first_name: string;
  last_name: string;
  email: string | null;
}>) {
  // `role` is deliberately absent: it is read-only after signup on the backend
  // (ADR-013), so offering it here would only produce a silently ignored field.
  const { data } = await api.patch<AuthUser>("/me/", body);
  return normalizeUser(data);
}

export async function uploadAvatar(file: File) {
  const form = new FormData();
  form.append("avatar", file);
  const { data } = await api.patch<AuthUser>("/me/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return normalizeUser(data);
}

export async function patchCustomerProfile(body: {
  display_name?: string;
  // The API names these `latitude` / `longitude`; they map to `home_*` on the model. Sending
  // the model names silently did nothing, since DRF ignores unknown fields.
  latitude?: number | null;
  longitude?: number | null;
}) {
  const { data } = await api.patch<CustomerProfile>("/customers/profile/", body);
  return data;
}

/** @deprecated Use `patchProviderProfile` from `services/providers`. */
export async function patchProviderProfile(body: { business_name?: string; bio?: string }) {
  const { data } = await api.patch<ProviderProfile>("/providers/profile/", body);
  return data;
}
