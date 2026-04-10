import { api } from "@/lib/api";

export async function sendOtp(phone: string) {
  await api.post("/auth/send-otp/", { phone });
}

export async function verifyOtp(
  phone: string,
  code: string,
  role?: "driver" | "mechanic",
) {
  const { data } = await api.post<{ access: string; refresh: string }>(
    "/auth/verify-otp/",
    { phone, code, ...(role ? { role } : {}) },
  );
  return data;
}
