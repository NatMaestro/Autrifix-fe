"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Check, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import {
  createAgency,
  inviteMember,
  isAgencyAdmin,
  listMembers,
  listMyMemberships,
  removeMember,
  respondToInvitation,
  roleLabel,
  type InvitableRole,
} from "@/services/agencies";

function errorStatus(error: unknown): number | undefined {
  return (error as { response?: { status?: number } })?.response?.status;
}

/**
 * Agencies: a business that fields several providers.
 *
 * The individual provider stays the unit of work — they hold the profile, accept the job,
 * and talk to the customer (backend ADR-021). What the agency buys is a shared business
 * identity and, crucially, a verification level that **lifts** its active members: onboarding
 * an operator into an already-verified agency skips a second document review.
 *
 * A provider belongs to at most one agency, so this panel is always in exactly one of three
 * states: no membership, an invitation to answer, or a member view.
 */
export function AgencyPanel() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState<InvitableRole>("operator");

  const membershipsQ = useQuery({
    queryKey: ["my-memberships"],
    queryFn: listMyMemberships,
    staleTime: 30_000,
  });

  const memberships = membershipsQ.data ?? [];
  const active = memberships.find((m) => m.status === "active") ?? null;
  const invitation = memberships.find((m) => m.status === "invited") ?? null;

  const membersQ = useQuery({
    queryKey: ["agency-members", active?.agency],
    queryFn: () => listMembers(active!.agency),
    enabled: Boolean(active?.agency),
    staleTime: 30_000,
  });

  function refresh() {
    qc.invalidateQueries({ queryKey: ["my-memberships"] });
    qc.invalidateQueries({ queryKey: ["agency-members"] });
    qc.invalidateQueries({ queryKey: ["verification-status"] });
  }

  const createMut = useMutation({
    mutationFn: () => createAgency({ name: name.trim() }),
    onSuccess: () => {
      refresh();
      setName("");
      toast.success("Agency created. You are its owner.");
    },
    onError: (error: unknown) =>
      toast.error(
        errorStatus(error) === 409
          ? "You already belong to an agency."
          : "Could not create the agency.",
      ),
  });

  const respondMut = useMutation({
    mutationFn: (accept: boolean) => respondToInvitation(invitation!.id, accept),
    onSuccess: (_data, accept) => {
      refresh();
      toast.success(accept ? "You joined the agency." : "Invitation declined.");
    },
    onError: () => toast.error("Could not answer the invitation."),
  });

  const inviteMut = useMutation({
    mutationFn: () =>
      inviteMember(active!.agency, { phone: invitePhone.trim(), role: inviteRole }),
    onSuccess: () => {
      refresh();
      setInvitePhone("");
      toast.success("Invitation sent.");
    },
    onError: (error: unknown) => {
      const status = errorStatus(error);
      toast.error(
        status === 404
          ? "No provider account uses that number."
          : status === 409
            ? "That provider is already in an agency."
            : status === 403
              ? "Only an owner or manager can invite."
              : "Could not send the invitation.",
      );
    },
  });

  const removeMut = useMutation({
    mutationFn: (membershipId: string) => removeMember(active!.agency, membershipId),
    onSuccess: () => {
      refresh();
      toast.success("Membership ended.");
    },
    onError: (error: unknown) =>
      toast.error(
        errorStatus(error) === 409
          ? "An agency must keep at least one owner. Promote someone first."
          : "Could not remove that member.",
      ),
  });

  // --- an invitation waiting to be answered ---------------------------------------
  if (invitation) {
    return (
      <GlassCard className="border-white/10 bg-[#1f2c3f]/90">
        <div className="flex items-center gap-2 text-white/70">
          <Building2 className="h-4 w-4 text-[#00E676]" />
          <p className="text-[11px] uppercase tracking-[0.16em]">Agency invitation</p>
        </div>
        <p className="mt-3 font-sora text-2xl font-semibold text-white">
          {invitation.agency_name}
        </p>
        <p className="mt-1 text-sm text-white/60">
          You have been invited as {roleLabel(invitation.role).toLowerCase()}. Joining a
          verified agency can raise your own verification level.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            type="button"
            className="gap-2"
            disabled={respondMut.isPending}
            onClick={() => respondMut.mutate(true)}
          >
            <Check className="h-4 w-4" /> Join
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={respondMut.isPending}
            onClick={() => respondMut.mutate(false)}
          >
            <X className="h-4 w-4" /> Decline
          </Button>
        </div>
      </GlassCard>
    );
  }

  // --- no agency -------------------------------------------------------------------
  if (!active) {
    return (
      <GlassCard className="border-white/10 bg-[#1f2c3f]/90">
        <div className="flex items-center gap-2 text-white/70">
          <Building2 className="h-4 w-4 text-white/40" />
          <p className="text-[11px] uppercase tracking-[0.16em]">Agency</p>
        </div>
        <p className="mt-3 text-sm text-white/60">
          Working as part of a business? Register it here, or ask an owner to invite the number
          you signed up with.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Business name"
            className="flex-1 rounded-lg border border-white/15 bg-[#1b2739]/60 px-3 py-2 text-sm text-white/90 outline-none focus:border-white/35"
          />
          <Button
            type="button"
            variant="outline"
            disabled={!name.trim() || createMut.isPending}
            onClick={() => createMut.mutate()}
          >
            Create
          </Button>
        </div>
      </GlassCard>
    );
  }

  // --- a member view ----------------------------------------------------------------
  const canAdminister = isAgencyAdmin(active.role);
  const members = membersQ.data ?? [];

  return (
    <GlassCard className="border-white/10 bg-[#1f2c3f]/90">
      <div className="flex items-center gap-2 text-white/70">
        <Building2 className="h-4 w-4 text-[#00E676]" />
        <p className="text-[11px] uppercase tracking-[0.16em]">Agency</p>
      </div>
      <p className="mt-3 font-sora text-2xl font-semibold text-white">{active.agency_name}</p>
      <p className="mt-1 text-sm text-white/60">You are {roleLabel(active.role).toLowerCase()}.</p>

      <ul className="mt-4 space-y-2">
        {members.map((member) => (
          <li
            key={member.id}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#1b2739]/60 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-white/90">{member.provider_name}</p>
              <p className="text-xs text-white/45">
                {roleLabel(member.role)}
                {member.status === "invited" ? " · invitation pending" : ""}
              </p>
            </div>
            {/* Removing your own membership is "leave", which every member may do. */}
            {canAdminister || member.id === active.id ? (
              <button
                type="button"
                onClick={() => removeMut.mutate(member.id)}
                disabled={removeMut.isPending}
                className="text-xs uppercase tracking-wider text-[#f4b8b7] disabled:opacity-50"
              >
                {member.id === active.id ? "Leave" : "Remove"}
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      {canAdminister ? (
        <div className="mt-4 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Invite a provider</p>
          <div className="flex gap-2">
            <input
              value={invitePhone}
              onChange={(e) => setInvitePhone(e.target.value)}
              placeholder="Phone they signed up with"
              className="flex-1 rounded-lg border border-white/15 bg-[#1b2739]/60 px-3 py-2 text-sm text-white/90 outline-none focus:border-white/35"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as InvitableRole)}
              className="rounded-lg border border-white/15 bg-[#1b2739]/60 px-2 py-2 text-sm text-white/90"
            >
              <option value="operator">Operator</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            disabled={!invitePhone.trim() || inviteMut.isPending}
            onClick={() => inviteMut.mutate()}
          >
            <UserPlus className="h-4 w-4" /> Send invitation
          </Button>
          <p className="text-xs text-white/40">
            Owners are promoted from existing members, not invited.
          </p>
        </div>
      ) : null}
    </GlassCard>
  );
}
