export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

export const ENABLE_OTP_BYPASS = process.env.NEXT_PUBLIC_ENABLE_OTP_BYPASS === "true";

export const ISSUE_QUICK_TAGS = [
  { id: "engine", label: "Engine issue", icon: "engine" as const },
  { id: "tire", label: "Flat tire", icon: "tire" as const },
  { id: "battery", label: "Battery", icon: "battery" as const },
  { id: "accident", label: "Accident", icon: "accident" as const },
] as const;
