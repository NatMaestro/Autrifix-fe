import { api } from "@/lib/api";
import { API_BASE } from "@/lib/constants";

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

export async function fetchMe() {
  const { data } = await api.get<AuthUser>("/me/");
  return normalizeUser(data);
}

export async function patchMe(body: Partial<{
  first_name: string;
  last_name: string;
  role: "driver" | "mechanic";
  email: string | null;
}>) {
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

export async function patchDriverProfile(body: { display_name?: string }) {
  const { data } = await api.patch("/drivers/profile/", body);
  return data;
}

export async function patchMechanicProfile(body: { business_name?: string; bio?: string }) {
  const { data } = await api.patch("/mechanics/profile/", body);
  return data;
}
