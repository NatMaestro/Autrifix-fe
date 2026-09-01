/**
 * Agencies have three mutually exclusive states, because a provider belongs to at most one
 * agency: no membership, an invitation to answer, or a member view. Rendering the wrong one
 * is the whole failure mode.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AgencyPanel } from "@/components/providers/agency-panel";

const mocks = vi.hoisted(() => ({
  createAgency: vi.fn(),
  inviteMember: vi.fn(),
  listMembers: vi.fn(),
  listMyMemberships: vi.fn(),
  removeMember: vi.fn(),
  respondToInvitation: vi.fn(),
}));

vi.mock("@/services/agencies", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/agencies")>()),
  ...mocks,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function membership(overrides: Record<string, unknown> = {}) {
  return {
    id: "m1",
    agency: "a1",
    agency_name: "Kaneshie Towing",
    provider: "p1",
    provider_name: "Kwame",
    role: "operator",
    status: "active",
    invited_at: new Date().toISOString(),
    joined_at: new Date().toISOString(),
    removed_at: null,
    ...overrides,
  };
}

beforeEach(() => {
  mocks.listMyMemberships.mockResolvedValue([]);
  mocks.listMembers.mockResolvedValue([]);
  mocks.createAgency.mockResolvedValue({});
  mocks.respondToInvitation.mockResolvedValue({});
  mocks.inviteMember.mockResolvedValue({});
  mocks.removeMember.mockResolvedValue({});
});

describe("no agency", () => {
  it("offers to register one", async () => {
    render(<AgencyPanel />, { wrapper });
    expect(await screen.findByPlaceholderText(/business name/i)).toBeInTheDocument();
  });

  it("does not create with a blank name", async () => {
    render(<AgencyPanel />, { wrapper });
    expect(await screen.findByRole("button", { name: /create/i })).toBeDisabled();
  });
});

describe("a pending invitation", () => {
  beforeEach(() => {
    mocks.listMyMemberships.mockResolvedValue([membership({ status: "invited", joined_at: null })]);
  });

  it("is shown ahead of anything else", async () => {
    render(<AgencyPanel />, { wrapper });
    expect(await screen.findByText("Kaneshie Towing")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /join/i })).toBeInTheDocument();
  });

  it("explains that joining can raise the provider's own verification level", async () => {
    // This is the reason agencies exist at all; without it "join" is a meaningless choice.
    render(<AgencyPanel />, { wrapper });
    expect(await screen.findByText(/raise your own verification level/i)).toBeInTheDocument();
  });

  it("sends accept and decline distinctly", async () => {
    render(<AgencyPanel />, { wrapper });
    await userEvent.click(await screen.findByRole("button", { name: /join/i }));
    expect(mocks.respondToInvitation).toHaveBeenCalledWith("m1", true);

    await userEvent.click(screen.getByRole("button", { name: /decline/i }));
    expect(mocks.respondToInvitation).toHaveBeenCalledWith("m1", false);
  });
});

describe("a member view", () => {
  it("lets an owner invite, and says owners are promoted not invited", async () => {
    mocks.listMyMemberships.mockResolvedValue([membership({ role: "owner" })]);
    mocks.listMembers.mockResolvedValue([membership({ role: "owner" })]);
    render(<AgencyPanel />, { wrapper });

    expect(await screen.findByPlaceholderText(/phone they signed up with/i)).toBeInTheDocument();
    expect(screen.getByText(/promoted from existing members/i)).toBeInTheDocument();
  });

  it("hides invite controls from an operator", async () => {
    mocks.listMyMemberships.mockResolvedValue([membership({ role: "operator" })]);
    mocks.listMembers.mockResolvedValue([membership({ role: "operator" })]);
    render(<AgencyPanel />, { wrapper });

    await screen.findByText("Kaneshie Towing");
    expect(screen.queryByPlaceholderText(/phone they signed up with/i)).not.toBeInTheDocument();
  });

  it("offers Leave on your own row rather than Remove", async () => {
    // Removing your own membership is leaving, which every member may do — including an
    // operator who cannot remove anyone else.
    mocks.listMyMemberships.mockResolvedValue([membership({ role: "operator" })]);
    mocks.listMembers.mockResolvedValue([membership({ role: "operator" })]);
    render(<AgencyPanel />, { wrapper });

    expect(await screen.findByRole("button", { name: /leave/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^remove$/i })).not.toBeInTheDocument();
  });

  it("marks a member whose invitation is still outstanding", async () => {
    mocks.listMyMemberships.mockResolvedValue([membership({ role: "owner" })]);
    mocks.listMembers.mockResolvedValue([
      membership({ role: "owner" }),
      membership({ id: "m2", provider_name: "Ama", status: "invited" }),
    ]);
    render(<AgencyPanel />, { wrapper });

    expect(await screen.findByText(/invitation pending/i)).toBeInTheDocument();
  });
});
