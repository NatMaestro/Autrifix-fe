/**
 * The customer's side of the money loop.
 *
 * This panel is the only way a job can be completed from the UI. If it stops rendering the
 * confirm action, every finished job silently stalls until the backend's auto-confirmation
 * window closes it *against* the customer — a failure with no error message anywhere.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { JobMoneyPanel } from "@/components/jobs/job-money-panel";
import type { Job } from "@/lib/api-schema";

const { confirmJob, listQuotes, respondToQuote } = vi.hoisted(() => ({
  confirmJob: vi.fn(),
  listQuotes: vi.fn(),
  respondToQuote: vi.fn(),
}));

vi.mock("@/services/jobs", () => ({ confirmJob, listQuotes, respondToQuote }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function job(overrides: Partial<Job> = {}): Job {
  return {
    id: "job-1",
    service_request: "req-1",
    provider: "prov-1",
    provider_name: "Kaneshie Towing",
    provider_verification_level: "documents",
    customer_name: "Ama",
    service_category_name: "Battery",
    status: "active",
    accepted_at: null,
    work_finished_at: null,
    completed_at: null,
    final_amount: null,
    currency: "",
    latest_quote: null,
    amount_variance: null,
    auto_confirmed: false,
    notes: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as Job;
}

beforeEach(() => {
  listQuotes.mockResolvedValue([]);
  confirmJob.mockResolvedValue(job({ status: "completed" }));
  respondToQuote.mockResolvedValue({});
});

describe("a pending quote", () => {
  const pending = [
    { id: "q1", job: "job-1", amount: "200.00", currency: "GHS", notes: "Alternator", status: "pending" },
  ];

  it("shows the price and what it covers", async () => {
    listQuotes.mockResolvedValue(pending);
    render(<JobMoneyPanel job={job()} />, { wrapper });

    expect(await screen.findByText("GHS 200.00")).toBeInTheDocument();
    expect(screen.getByText("Alternator")).toBeInTheDocument();
  });

  it("says declining is not a cancellation", async () => {
    // The backend treats a decline as an invitation to revise. If the UI implies the job is
    // being cancelled, customers will avoid declining a price they disagree with.
    listQuotes.mockResolvedValue(pending);
    render(<JobMoneyPanel job={job()} />, { wrapper });

    expect(await screen.findByText(/not a cancellation/i)).toBeInTheDocument();
  });

  it("sends accept and decline distinctly", async () => {
    listQuotes.mockResolvedValue(pending);
    render(<JobMoneyPanel job={job()} />, { wrapper });

    await userEvent.click(await screen.findByRole("button", { name: /accept/i }));
    await waitFor(() => expect(respondToQuote).toHaveBeenCalledWith("job-1", "q1", true));

    await userEvent.click(screen.getByRole("button", { name: /decline/i }));
    await waitFor(() => expect(respondToQuote).toHaveBeenCalledWith("job-1", "q1", false));
  });
});

describe("awaiting confirmation", () => {
  const finished = job({
    status: "awaiting_confirmation",
    final_amount: "250.00",
    currency: "GHS",
  });

  it("offers the confirm action with the amount named", async () => {
    render(<JobMoneyPanel job={finished} />, { wrapper });

    const button = await screen.findByRole("button", { name: /confirm GHS 250\.00/i });
    await userEvent.click(button);
    await waitFor(() => expect(confirmJob).toHaveBeenCalledWith("job-1"));
  });

  it("says the platform does not handle the payment", async () => {
    // Settlement is cash between the two parties (backend ADR-022). A customer who believes
    // confirming pays the provider would leave without paying.
    render(<JobMoneyPanel job={finished} />, { wrapper });
    expect(await screen.findByText(/does not handle\s+the payment/i)).toBeInTheDocument();
  });

  it("warns when the amount exceeds the accepted quote", async () => {
    render(
      <JobMoneyPanel job={job({ ...finished, amount_variance: "75.00" })} />,
      { wrapper },
    );

    expect(await screen.findByText(/more than the quote you accepted/i)).toBeInTheDocument();
    expect(screen.getByText(/GHS 75\.00/)).toBeInTheDocument();
  });

  it("does not warn when the amount matches or undercuts the quote", async () => {
    render(<JobMoneyPanel job={job({ ...finished, amount_variance: "0.00" })} />, { wrapper });
    await screen.findByRole("button", { name: /confirm/i });
    expect(screen.queryByText(/more than the quote/i)).not.toBeInTheDocument();

    render(<JobMoneyPanel job={job({ ...finished, amount_variance: "-20.00" })} />, { wrapper });
    expect(screen.queryByText(/more than the quote/i)).not.toBeInTheDocument();
  });
});

describe("states with nothing to decide", () => {
  it("renders nothing for a job still in progress with no quote", async () => {
    const { container } = render(<JobMoneyPanel job={job()} />, { wrapper });
    await waitFor(() => expect(listQuotes).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing once the job is completed", () => {
    const { container } = render(
      <JobMoneyPanel job={job({ status: "completed" })} />,
      { wrapper },
    );
    expect(container).toBeEmptyDOMElement();
  });
});
