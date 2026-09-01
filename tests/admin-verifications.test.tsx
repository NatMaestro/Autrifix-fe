/**
 * The verification queue is the operator surface that decides who may attend a stranded
 * customer. Two behaviours matter more than the rest: a decline must carry a reason, and the
 * submitted identity documents must not appear here.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminVerificationsPage from "@/app/admin/verifications/page";

const { listVerifications, reviewVerification } = vi.hoisted(() => ({
  listVerifications: vi.fn(),
  reviewVerification: vi.fn(),
}));

vi.mock("@/services/administration", () => ({ listVerifications, reviewVerification }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function submission(overrides: Record<string, unknown> = {}) {
  return {
    id: "s1",
    provider_id: "p1",
    provider_name: "Kaneshie Towing",
    provider_type: "tow",
    current_level: "none",
    requested_level: "documents",
    status: "pending",
    submitted_at: new Date().toISOString(),
    reviewed_at: null,
    reviewed_by_label: null,
    review_notes: "",
    ...overrides,
  };
}

beforeEach(() => {
  listVerifications.mockResolvedValue([submission()]);
  reviewVerification.mockResolvedValue(submission({ status: "approved" }));
});

describe("the queue", () => {
  it("shows who is waiting and what they are asking for", async () => {
    render(<AdminVerificationsPage />, { wrapper });

    expect(await screen.findByText("Kaneshie Towing")).toBeInTheDocument();
    expect(screen.getByText(/requesting Documents verified/i)).toBeInTheDocument();
  });

  it("never renders the submitted documents", async () => {
    // Serving identity documents through the operator API would protect them with nothing
    // but a URL. A reviewer opens them in Django admin instead (SPEC-012 OQ-012-I).
    const { container } = render(<AdminVerificationsPage />, { wrapper });
    await screen.findByText("Kaneshie Towing");

    expect(container.querySelector("img")).toBeNull();
    expect(screen.queryByText(/id_document|selfie|workshop_photo/i)).not.toBeInTheDocument();
  });

  it("says so plainly when nothing is waiting", async () => {
    listVerifications.mockResolvedValue([]);
    render(<AdminVerificationsPage />, { wrapper });

    expect(await screen.findByText(/nothing waiting/i)).toBeInTheDocument();
  });
});

describe("reviewing", () => {
  it("approves without requiring a note", async () => {
    render(<AdminVerificationsPage />, { wrapper });
    // Exact match: the "approved" filter tab also contains "approve".
    await userEvent.click(await screen.findByRole("button", { name: /^approve$/i }));

    await waitFor(() =>
      expect(reviewVerification).toHaveBeenCalledWith("s1", { approve: true, notes: "" }),
    );
  });

  it("sends the typed reason when declining", async () => {
    // The backend rejects a note-less decline, and the provider is shown this text — without
    // it they have nothing to act on.
    render(<AdminVerificationsPage />, { wrapper });

    await userEvent.type(
      await screen.findByPlaceholderText(/required when declining/i),
      "ID photo unreadable",
    );
    await userEvent.click(screen.getByRole("button", { name: /^decline$/i }));

    await waitFor(() =>
      expect(reviewVerification).toHaveBeenCalledWith("s1", {
        approve: false,
        notes: "ID photo unreadable",
      }),
    );
  });
});

describe("already-reviewed submissions", () => {
  it("shows the decision and who made it, with no action buttons", async () => {
    listVerifications.mockResolvedValue([
      submission({
        status: "rejected",
        review_notes: "Workshop photo did not match.",
        reviewed_by_label: "Ops",
      }),
    ]);
    render(<AdminVerificationsPage />, { wrapper });

    expect(await screen.findByText(/workshop photo did not match/i)).toBeInTheDocument();
    expect(screen.getByText(/— Ops/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^approve$/i })).not.toBeInTheDocument();
  });
});
