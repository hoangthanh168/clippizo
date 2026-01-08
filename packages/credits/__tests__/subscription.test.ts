import { beforeEach, describe, expect, it, vi } from "vitest";

// Create hoisted mocks
const {
  mockFindUnique,
  mockFindMany,
  mockUpdateMany,
  mockCreate,
  mockAggregate,
  mockTransaction,
} = vi.hoisted(() => {
  const mockFindUnique = vi.fn();
  const mockFindMany = vi.fn();
  const mockUpdateMany = vi.fn();
  const mockCreate = vi.fn();
  const mockAggregate = vi.fn();
  const mockTransaction = vi.fn((callback: (tx: unknown) => unknown) =>
    callback({
      creditSource: {
        findMany: mockFindMany,
        updateMany: mockUpdateMany,
        aggregate: mockAggregate,
      },
      creditTransaction: {
        create: mockCreate,
      },
      profile: {
        findUnique: mockFindUnique,
      },
    })
  );
  return {
    mockFindUnique,
    mockFindMany,
    mockUpdateMany,
    mockCreate,
    mockAggregate,
    mockTransaction,
  };
});

// Mock database
vi.mock("@repo/database", () => ({
  database: {
    $transaction: mockTransaction,
    creditSource: {
      findMany: mockFindMany,
      updateMany: mockUpdateMany,
      aggregate: mockAggregate,
    },
    creditTransaction: {
      create: mockCreate,
    },
    profile: {
      findUnique: mockFindUnique,
    },
  },
  Prisma: {
    InputJsonValue: {},
  },
}));

import {
  canUseCreditsAfterCancellation,
  forfeitAllCredits,
  handleSubscriptionCancellation,
} from "../subscription";

describe("Subscription Credits Handling", () => {
  const mockProfileId = "profile-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("canUseCreditsAfterCancellation", () => {
    it("returns true if subscription period has not ended", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      mockFindUnique.mockResolvedValue({
        id: mockProfileId,
        subscriptionStatus: "cancelled",
        subscriptionExpiresAt: futureDate,
      });

      const result = await canUseCreditsAfterCancellation(mockProfileId);

      expect(result.canUse).toBe(true);
      expect(result.reason).toContain("period");
    });

    it("returns false if subscription period has ended", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      mockFindUnique.mockResolvedValue({
        id: mockProfileId,
        subscriptionStatus: "cancelled",
        subscriptionExpiresAt: pastDate,
      });

      const result = await canUseCreditsAfterCancellation(mockProfileId);

      expect(result.canUse).toBe(false);
      expect(result.reason).toContain("expired");
    });

    it("returns true if subscription is active", async () => {
      mockFindUnique.mockResolvedValue({
        id: mockProfileId,
        subscriptionStatus: "active",
        subscriptionExpiresAt: new Date(Date.now() + 86_400_000),
      });

      const result = await canUseCreditsAfterCancellation(mockProfileId);

      expect(result.canUse).toBe(true);
    });
  });

  describe("forfeitAllCredits", () => {
    it("forfeits all remaining credits and logs transaction", async () => {
      const mockSources = [
        { id: "source-1", amount: 100, type: "monthly" },
        { id: "source-2", amount: 50, type: "pack" },
      ];

      mockFindMany.mockResolvedValue(mockSources);
      mockAggregate.mockResolvedValue({ _sum: { amount: 150 } });
      mockUpdateMany.mockResolvedValue({ count: 2 });
      mockCreate.mockResolvedValue({
        id: "tx-forfeit",
        profileId: mockProfileId,
        type: "expiration",
        amount: -150,
        balanceAfter: 0,
      });

      const result = await forfeitAllCredits(
        mockProfileId,
        "subscription_ended"
      );

      expect(result.success).toBe(true);
      expect(result.creditsForfeited).toBe(150);

      // Verify credits were zeroed out
      expect(mockUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            profileId: mockProfileId,
          }),
          data: { amount: 0 },
        })
      );
    });

    it("handles case with no credits to forfeit", async () => {
      mockFindMany.mockResolvedValue([]);
      mockAggregate.mockResolvedValue({ _sum: { amount: 0 } });

      const result = await forfeitAllCredits(
        mockProfileId,
        "subscription_ended"
      );

      expect(result.success).toBe(true);
      expect(result.creditsForfeited).toBe(0);
      expect(mockUpdateMany).not.toHaveBeenCalled();
    });
  });

  describe("handleSubscriptionCancellation", () => {
    it("marks profile for cancellation without immediate forfeiture", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);

      mockFindUnique.mockResolvedValue({
        id: mockProfileId,
        subscriptionStatus: "active",
        subscriptionExpiresAt: futureDate,
      });

      const result = await handleSubscriptionCancellation(mockProfileId);

      expect(result.canUseUntil).toEqual(futureDate);
      expect(result.creditsForfeited).toBe(0);
    });

    it("forfeits credits when subscription has already expired", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      mockFindUnique.mockResolvedValue({
        id: mockProfileId,
        subscriptionStatus: "cancelled",
        subscriptionExpiresAt: pastDate,
      });

      mockFindMany.mockResolvedValue([
        { id: "source-1", amount: 200, type: "monthly" },
      ]);
      mockAggregate.mockResolvedValue({ _sum: { amount: 200 } });
      mockUpdateMany.mockResolvedValue({ count: 1 });
      mockCreate.mockResolvedValue({
        id: "tx-forfeit",
        profileId: mockProfileId,
        type: "expiration",
        amount: -200,
        balanceAfter: 0,
      });

      const result = await handleSubscriptionCancellation(mockProfileId);

      expect(result.creditsForfeited).toBe(200);
    });
  });
});
