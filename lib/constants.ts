export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

/** Where the Next.js app lives in production (e.g. https://app.autrifix.com). Leave empty for same-origin / local. */
export const APP_ORIGIN = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");

/** Absolute URL to a path on the app (sign-in, register, etc.). */
export function appHref(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return APP_ORIGIN ? `${APP_ORIGIN}${p}` : p;
}

export const ENABLE_OTP_BYPASS = process.env.NEXT_PUBLIC_ENABLE_OTP_BYPASS === "true";

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export const ISSUE_QUICK_TAGS = [
  { id: "engine", label: "Engine issue", icon: "engine" as const },
  { id: "tire", label: "Flat tire", icon: "tire" as const },
  { id: "battery", label: "Battery", icon: "battery" as const },
  { id: "accident", label: "Accident", icon: "accident" as const },
] as const;
