/**
 * The provider's route out of being blocked.
 *
 * An unverified provider can browse but not accept. That only works as a nudge if this panel
 * tells them what they are missing and lets them fix it — otherwise the gate that protects
 * customers just locks providers out permanently, which is what it did before this existed.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VerificationPanel } from "@/components/providers/verification-panel";

const { getVerificationStatus, submitVerification } = vi.hoisted(() => ({
  getVerificationStatus: vi.fn(),
  submitVerification: vi.fn(),
}));

vi.mock("@/services/verification", async (importOriginal) => ({
  // Keep the real label helpers — they are part of what this panel is asserting.
  ...(await importOriginal<typeof import("@/services/verification")>()),
  getVerificationStatus,
  submitVerification,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function status(overrides: Record<string, unknown> = {}) {
  return {
    verification_level: "none",
    exact_location_unlocked: false,
    can_accept_jobs: false,
    accept_requires_level: "documents",
    profile_complete: true,
    phone_verified: false,
    missing_requirements: [],
    submission: null,
    ...overrides,
  };
}

beforeEach(() => {
  getVerificationStatus.mockResolvedValue(status());
  submitVerification.mockResolvedValue(status());
});

describe("a blocked provider", () => {
  it("says plainly that they cannot accept jobs, and what level is needed", async () => {
    render(<VerificationPanel />, { wrapper });

    expect(
      await screen.findByText(/cannot accept jobs yet — Documents verified is required/i),
    ).toBeInTheDocument();
  });

  it("explains that locations are approximate until verified", async () => {
    // Providers otherwise blame the platform for coordinates that are deliberately coarse.
    render(<VerificationPanel />, { wrapper });
    expect(await screen.findByText(/shown approximately until you verify/i)).toBeInTheDocument();
  });

  it("lists outstanding profile requirements in plain language", async () => {
    getVerificationStatus.mockResolvedValue(
      status({ missing_requirements: ["business_name", "workshop_location"] }),
    );
    render(<VerificationPanel />, { wrapper });

    expect(await screen.findByText(/Add your business name/i)).toBeInTheDocument();
    expect(screen.getByText(/Set your workshop location on the map/i)).toBeInTheDocument();
  });

  it("tells the provider their documents are deleted after review", async () => {
    // True (backend SPEC-013 REQ-8), and the kind of thing someone wants to know before
    // uploading a photo of their ID.
    render(<VerificationPanel />, { wrapper });
    expect(await screen.findByText(/deleted once a decision is made/i)).toBeInTheDocument();
  });

  it("keeps submission disabled until all three files are chosen", async () => {
    render(<VerificationPanel />, { wrapper });
    expect(await screen.findByRole("button", { name: /submit for review/i })).toBeDisabled();
  });
});

describe("a verified provider", () => {
  it("confirms what is unlocked", async () => {
    getVerificationStatus.mockResolvedValue(
      status({
        verification_level: "documents",
        can_accept_jobs: true,
        exact_location_unlocked: true,
      }),
    );
    render(<VerificationPanel />, { wrapper });

    expect(await screen.findByText("Documents verified")).toBeInTheDocument();
    expect(screen.getByText("You can accept jobs.")).toBeInTheDocument();
  });
});

describe("a submission under review", () => {
  it("shows the waiting state instead of the upload form", async () => {
    getVerificationStatus.mockResolvedValue(
      status({
        submission: {
          id: "s1",
          requested_level: "documents",
          status: "pending",
          submitted_at: new Date().toISOString(),
          reviewed_at: null,
          review_notes: "",
        },
      }),
    );
    render(<VerificationPanel />, { wrapper });

    expect(await screen.findByText(/with a reviewer/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /submit for review/i })).not.toBeInTheDocument();
  });
});

describe("a rejected submission", () => {
  it("shows the reviewer's reason and lets them try again", async () => {
    getVerificationStatus.mockResolvedValue(
      status({
        submission: {
          id: "s1",
          requested_level: "documents",
          status: "rejected",
          submitted_at: new Date().toISOString(),
          reviewed_at: new Date().toISOString(),
          review_notes: "ID photo was unreadable.",
        },
      }),
    );
    render(<VerificationPanel />, { wrapper });

    expect(await screen.findByText(/ID photo was unreadable/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit for review/i })).toBeInTheDocument();
  });
});
