/**
 * Contract-shaped helpers, tested because each one encodes a decision that a rename or a
 * backend change could silently invert.
 *
 * Deliberately not testing the generated types — `tsc` already does that. These cover the
 * hand-written layer on top, which is where the drift has actually happened.
 */

import { describe, expect, it } from "vitest";

import { jobStatusLabel, unwrapList } from "@/lib/api-schema";
import { isActionable, notificationHref } from "@/services/notifications";
import { asVerificationRequired, levelLabel, requirementLabel } from "@/services/verification";

describe("unwrapList", () => {
  it("accepts a bare array", () => {
    expect(unwrapList([1, 2])).toEqual([1, 2]);
  });

  it("accepts a DRF page", () => {
    expect(unwrapList({ count: 2, results: [1, 2] })).toEqual([1, 2]);
  });

  it("returns an empty array rather than throwing on null", () => {
    // Several endpoints are unpaginated by design, so callers cannot assume `results`.
    // Returning [] keeps a shape change from crashing a list screen.
    expect(unwrapList(null)).toEqual([]);
    expect(unwrapList(undefined)).toEqual([]);
  });
});

describe("jobStatusLabel", () => {
  it("names awaiting_confirmation from the customer's point of view", () => {
    // "awaiting confirmation" is ambiguous about who is waiting. The customer is the one
    // being waited on, and the label has to say so.
    expect(jobStatusLabel("awaiting_confirmation")).toBe("Awaiting your confirmation");
  });

  it("labels the ordinary states", () => {
    expect(jobStatusLabel("pending_accept")).toBe("Pending");
    expect(jobStatusLabel("active")).toBe("In progress");
    expect(jobStatusLabel("completed")).toBe("Completed");
  });

  it("degrades rather than throwing on an unknown or missing status", () => {
    // `status` is optional in the schema because the backend supplies a default.
    expect(jobStatusLabel(undefined)).toBe("Unknown");
    expect(jobStatusLabel("some_future_state" as never)).toBe("some future state");
  });
});

describe("notificationHref", () => {
  function notification(kind: string, payload: Record<string, unknown> = {}) {
    return {
      id: "n1",
      kind,
      title: "",
      body: "",
      payload,
      read_at: null,
      created_at: new Date().toISOString(),
    } as never;
  }

  it("sends the customer to the job they must confirm", () => {
    expect(
      notificationHref(notification("job.awaiting_confirmation", { job_id: "j1" }), "customer"),
    ).toBe("/customer/track?jobId=j1");
  });

  it("sends the provider to the job whose quote was answered", () => {
    expect(
      notificationHref(notification("quote.accepted", { job_id: "j1" }), "provider"),
    ).toBe("/provider/job/j1");
  });

  it("falls back to the role's home for an unknown kind", () => {
    // The kind catalogue has grown four times. A client that threw on an unrecognised kind
    // would make every backend addition a coordinated release.
    expect(notificationHref(notification("something.new"), "provider")).toBe("/provider");
    expect(notificationHref(notification("something.new"), "customer")).toBe("/customer");
  });

  it("does not build a broken link when the correlation id is missing", () => {
    expect(notificationHref(notification("job.awaiting_confirmation"), "customer")).toBe(
      "/customer",
    );
  });
});

describe("isActionable", () => {
  it("marks the kinds that ask the recipient to do something", () => {
    const kinds = ["job.awaiting_confirmation", "quote.submitted", "agency.invited"];
    for (const kind of kinds) {
      expect(isActionable({ kind } as never)).toBe(true);
    }
  });

  it("does not mark purely informational kinds", () => {
    expect(isActionable({ kind: "job.active" } as never)).toBe(false);
    expect(isActionable({ kind: "job.completed" } as never)).toBe(false);
  });
});

describe("asVerificationRequired", () => {
  it("recognises the gate and returns the levels", () => {
    const gate = asVerificationRequired({
      response: {
        data: {
          code: "verification_required",
          current_level: "none",
          required_level: "documents",
          verification_url: "/api/v1/providers/verification/",
          detail: "…",
        },
      },
    });
    expect(gate?.required_level).toBe("documents");
  });

  it("returns null for an ordinary failure", () => {
    // A 409 (job taken, at cap) must not be mistaken for the verification gate — they need
    // completely different messages.
    expect(asVerificationRequired({ response: { status: 409, data: {} } })).toBeNull();
    expect(asVerificationRequired(new Error("network"))).toBeNull();
    expect(asVerificationRequired(undefined)).toBeNull();
  });
});

describe("verification labels", () => {
  it("names each level in plain language", () => {
    expect(levelLabel("none")).toBe("Unverified");
    expect(levelLabel("ghana_card")).toBe("Ghana Card verified");
  });

  it("uses the backend's own requirement keys", () => {
    // These come from `missing_profile_requirements` — guessing them once already produced
    // labels for fields that do not exist.
    expect(requirementLabel("workshop_location")).toBe("Set your workshop location on the map");
    expect(requirementLabel("active_service_offering")).toBe(
      "List at least one service you offer",
    );
  });

  it("falls back readably for a key it does not know", () => {
    expect(requirementLabel("some_new_requirement")).toBe("some new requirement");
  });
});
