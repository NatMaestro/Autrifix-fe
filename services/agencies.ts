import { api } from "@/lib/api";
import {
  unwrapList,
  type Agency,
  type AgencyMembership,
  type Paginated,
  type ProviderType,
  type Schemas,
} from "@/lib/api-schema";

export type { Agency, AgencyMembership };

export type AgencyRole = Schemas["AgencyRoleEnum"];
export type InvitableRole = Schemas["AgencyInviteRoleEnum"];

/** The creator becomes the agency's first active owner. `409` if already in one. */
export async function createAgency(body: {
  name: string;
  provider_type?: ProviderType;
  contact_email?: string;
  contact_phone?: string;
  registration_number?: string;
}) {
  const { data } = await api.post<Agency>("/providers/agencies/", body);
  return data;
}

/** `404` for non-members — an agency id should not be confirmable from outside it. */
export async function getAgency(id: string) {
  const { data } = await api.get<Agency>(`/providers/agencies/${id}/`);
  return data;
}

/**
 * Edit business details.
 *
 * `verification_level` is deliberately absent: an agency that could set its own level would
 * lift every member's effective level with it (backend SPEC-017 REQ-3).
 */
export async function updateAgency(
  id: string,
  body: Partial<{
    name: string;
    provider_type: ProviderType;
    contact_email: string;
    contact_phone: string;
    registration_number: string;
  }>,
) {
  const { data } = await api.patch<Agency>(`/providers/agencies/${id}/`, body);
  return data;
}

export async function listMembers(agencyId: string) {
  const { data } = await api.get<Paginated<AgencyMembership> | AgencyMembership[]>(
    `/providers/agencies/${agencyId}/members/`,
  );
  return unwrapList(data);
}

/**
 * Invite by the phone number the provider signed up with.
 *
 * `owner` is not invitable — ownership transfers by promoting an existing member, since an
 * unaccepted owner is an agency with no live administrator.
 */
export async function inviteMember(
  agencyId: string,
  body: { phone: string; role?: InvitableRole },
) {
  const { data } = await api.post<AgencyMembership>(
    `/providers/agencies/${agencyId}/members/`,
    body,
  );
  return data;
}

export async function changeMemberRole(agencyId: string, membershipId: string, role: AgencyRole) {
  const { data } = await api.patch<AgencyMembership>(
    `/providers/agencies/${agencyId}/members/${membershipId}/`,
    { role },
  );
  return data;
}

/** Removes a member, or leaves the agency when it is your own membership. */
export async function removeMember(agencyId: string, membershipId: string) {
  const { data } = await api.delete<AgencyMembership>(
    `/providers/agencies/${agencyId}/members/${membershipId}/`,
  );
  return data;
}

/** Own memberships, **including invitations not yet answered** — the point of the endpoint. */
export async function listMyMemberships() {
  const { data } = await api.get<AgencyMembership[]>("/providers/memberships/");
  return unwrapList(data);
}

export async function respondToInvitation(membershipId: string, accept: boolean) {
  const { data } = await api.post<AgencyMembership>(
    `/providers/memberships/${membershipId}/respond/`,
    { accept },
  );
  return data;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  operator: "Operator",
};

export function roleLabel(role?: string | null): string {
  if (!role) return "Member";
  return ROLE_LABELS[role] ?? role;
}

/** Roles that may invite, remove, and edit the business. */
export function isAgencyAdmin(role?: string | null): boolean {
  return role === "owner" || role === "manager";
}
