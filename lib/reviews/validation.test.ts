import { describe, it, expect } from "vitest";
import { createReviewSchema } from "./validation";

describe("createReviewSchema", () => {
  const bookingId = "123e4567-e89b-12d3-a456-426614174000";

  it("accepts a valid review", () => {
    expect(
      createReviewSchema.safeParse({ bookingId, rating: 5, comment: "Très professionnel." }).success
    ).toBe(true);
  });

  it("accepts a review with no comment", () => {
    expect(createReviewSchema.safeParse({ bookingId, rating: 4, comment: "" }).success).toBe(true);
  });

  it("rejects a rating of 0", () => {
    expect(createReviewSchema.safeParse({ bookingId, rating: 0 }).success).toBe(false);
  });

  it("rejects a rating above 5", () => {
    expect(createReviewSchema.safeParse({ bookingId, rating: 6 }).success).toBe(false);
  });

  it("rejects a non-UUID bookingId", () => {
    expect(createReviewSchema.safeParse({ bookingId: "not-a-uuid", rating: 5 }).success).toBe(false);
  });

  it("rejects a comment over 1000 characters", () => {
    expect(
      createReviewSchema.safeParse({ bookingId, rating: 5, comment: "a".repeat(1001) }).success
    ).toBe(false);
  });
});
