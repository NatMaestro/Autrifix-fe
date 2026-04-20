import { redirect } from "next/navigation";

/** @deprecated Use `/auth/login` — kept so old links still work. */
export default function PhoneRedirectPage() {
  redirect("/auth/login");
}
