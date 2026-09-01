import { api } from "@/lib/api";
import { unwrapList, type Paginated, type Review, type Schemas } from "@/lib/api-schema";

export type { Review };

/** Reviews the caller wrote, plus reviews written about them as a provider. */
export async function listReviews() {
  const { data } = await api.get<Paginated<Review> | Review[]>("/reviews/");
  return unwrapList(data);
}

/**
 * Leave a review.
 *
 * The backend enforces all three eligibility rules — author is the job's customer, the job
 * is `completed`, one review per job per author. Since completion now means
 * *customer-confirmed*, a review can only exist for work the customer agreed was done.
 */
export async function createReview(input: {
  job: string;
  rating: number;
  comment?: string;
}) {
  const { data } = await api.post<Review>("/reviews/", {
    job: input.job,
    rating: input.rating,
    comment: input.comment ?? "",
  } satisfies Schemas["ReviewRequest"]);
  return data;
}

/** Already-reviewed reads as a uniqueness error; it deserves its own message. */
export function isDuplicateReview(error: unknown): boolean {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  return JSON.stringify(data ?? "").includes("unique");
}
