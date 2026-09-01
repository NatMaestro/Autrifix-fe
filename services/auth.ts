import { api } from "@/lib/api";
import type { SignupRole } from "@/lib/api-schema";

export type AuthTokens = { access: string; refresh: string };

export async function loginWithPassword(identifier: string, password: string) {
  const { data } = await api.post<AuthTokens>("/auth/login/", {
    identifier: identifier.trim(),
    password,
  });
  return data;
}

export async function registerWithPassword(body: {
  email: string;
  phone: string;
  password: string;
  password_confirm: string;
  role?: SignupRole;
}) {
  const { data } = await api.post<
    AuthTokens & {
      id: string;
      phone: string | null;
      email: string | null;
      role: string;
      first_name?: string;
      last_name?: string;
    }
  >("/auth/register/", {
    email: body.email.trim().toLowerCase(),
    phone: body.phone.trim(),
    password: body.password,
    password_confirm: body.password_confirm,
    ...(body.role ? { role: body.role } : {}),
  });
  return data;
}

export async function googleSignIn(idToken: string, role?: "customer" | "provider") {
  const { data } = await api.post<AuthTokens>("/auth/google/", {
    id_token: idToken,
    ...(role ? { role } : {}),
  });
  return data;
}

/** @deprecated OTP flow — kept for backwards compatibility until SMS is approved */
export async function sendOtp(phone: string) {
  await api.post("/auth/send-otp/", { phone });
}

/** @deprecated OTP flow */
export async function verifyOtp(
  phone: string,
  code: string,
  role?: SignupRole,
) {
  const { data } = await api.post<AuthTokens>(
    "/auth/verify-otp/",
    { phone, code, ...(role ? { role } : {}) },
  );
  return data;
}


/** Backend marker: this Google/OTP call would create an account, but no role was chosen. */
export const SIGNUP_ROLE_REQUIRED = "signup_role_required";

/**
 * True when the backend refused to create an account because no role was supplied.
 *
 * The account does **not** exist yet and nothing was consumed, so the correct response is
 * to ask which role and retry the same call — not to show a generic failure.
 */
export function isSignupRoleRequired(error: unknown): boolean {
  const data = (error as { response?: { data?: { code?: string } } })?.response?.data;
  return data?.code === SIGNUP_ROLE_REQUIRED;
}
