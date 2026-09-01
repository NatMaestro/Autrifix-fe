import { api } from "@/lib/api";
import type { Schemas, VerificationLevel } from "@/lib/api-schema";

export type VerificationStatus = Schemas["ProviderVerificationStatus"];
export type VerificationSubmission = Schemas["ProviderVerificationSubmission"];

export async function getVerificationStatus() {
  const { data } = await api.get<VerificationStatus>("/providers/verification/");
  return data;
}

/**
 * Submit documents for review.
 *
 * All three files are required by the backend. They are **purged once a decision is made**
 * (backend SPEC-013 REQ-8), so this is the only time they exist on the platform.
 */
export async function submitVerification(files: {
  idDocument: File;
  selfie: File;
  workshopPhoto: File;
}) {
  const form = new FormData();
  form.append("id_document", files.idDocument);
  form.append("selfie", files.selfie);
  form.append("workshop_photo", files.workshopPhoto);

  const { data } = await api.post<VerificationStatus>("/providers/verification/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/** The shape the backend sends with `403 verification_required`. */
export type VerificationRequired = {
  detail: string;
  code: "verification_required";
  current_level: VerificationLevel;
  required_level: VerificationLevel;
  verification_url: string;
};

/**
 * Recognise "you are not verified enough yet" as distinct from a generic failure.
 *
 * This is the reason unverified providers are allowed to browse at all: they should see the
 * work they are missing and be nudged toward verification. Rendering it as a generic error
 * throws away the entire design — and the response carries `current_level`,
 * `required_level`, and a URL specifically so the client can route them onward.
 */
export function asVerificationRequired(error: unknown): VerificationRequired | null {
  const data = (error as { response?: { data?: Partial<VerificationRequired> } })?.response
    ?.data;
  if (data?.code !== "verification_required") return null;
  return data as VerificationRequired;
}

const LEVEL_LABELS: Record<string, string> = {
  none: "Unverified",
  phone: "Phone verified",
  documents: "Documents verified",
  ghana_card: "Ghana Card verified",
};

export function levelLabel(level?: string | null): string {
  if (!level) return "Unverified";
  return LEVEL_LABELS[level] ?? level;
}

/** Plain-language rendering of `missing_requirements` from the status endpoint. */
/** Keys come from `missing_profile_requirements` on the backend — read, not guessed. */
const REQUIREMENT_LABELS: Record<string, string> = {
  business_name: "Add your business name",
  workshop_location: "Set your workshop location on the map",
  active_service_offering: "List at least one service you offer",
};

export function requirementLabel(key: string): string {
  return REQUIREMENT_LABELS[key] ?? key.replace(/_/g, " ");
}
