import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { API_BASE } from "@/lib/constants";
import { useAuthStore } from "@/store/auth-store";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

function getAccess() {
  return useAuthStore.getState().access;
}

function getRefresh() {
  return useAuthStore.getState().refresh;
}

function shouldAttachAuth(url: string | undefined) {
  if (!url) return true;
  // These endpoints are intentionally AllowAny on the backend.
  // Attaching a stale/invalid JWT can cause JWTAuthentication to reject the request before the view runs.
  const anonymousAuthPaths = [
    "auth/send-otp",
    "auth/verify-otp",
    "auth/register",
    "auth/login",
    "auth/token",
    "auth/refresh-token",
    "health/",
  ];
  return !anonymousAuthPaths.some((p) => url.includes(p));
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccess();
  if (token && shouldAttachAuth(config.url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefresh();
  if (!refresh) return null;
  const { data } = await axios.post<{ access: string; refresh?: string }>(
    `${API_BASE}/auth/refresh-token/`,
    { refresh },
  );
  useAuthStore.getState().setTokens(data.access, data.refresh ?? refresh);
  return data.access;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (
      error.response?.status !== 401 ||
      original?._retry ||
      !original ||
      original.url?.includes("/auth/refresh-token/") ||
      !shouldAttachAuth(original.url)
    ) {
      return Promise.reject(error);
    }
    original._retry = true;
    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const access = await refreshPromise;
      if (!access) throw error;
      original.headers.Authorization = `Bearer ${access}`;
      return api(original);
    } catch {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }
  },
);
