import { redirect } from "next/navigation";

/** @deprecated SMS OTP is disabled for MVP — use `/auth/login`. */
export default function OtpRedirectPage() {
  redirect("/auth/login");
}
