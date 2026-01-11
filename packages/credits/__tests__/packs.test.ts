import { beforeEach, describe, expect, it, vi } from "vitest";

// Use vi.hoisted to create mock functions that can be referenced in vi.mock
const {
  mockFindUnique,
  mockCreditSourceCreate,
  mockCreditSourceAggregate,
  mockCreditTransactionCreate,
  mockTransaction,
} = vi.hoisted(() => {
  const mockFindUnique = vi.fn();
  const mockCreditSourceCreate = vi.fn();
  const mockCreditSourceAggregate = vi.fn();
  const mockCreditTransactionCreate = vi.fn();
  const mockTransaction = vi.fn((callback: (tx: unknown) => unknown) =>
    callback({
      profile: { findUnique: mockFindUnique },
      creditSource: {
        create: mockCreditSourceCreate,
        aggregate: mockCreditSourceAggregate,
      },
      creditTransaction: { create: mockCreditTransactionCreate },
    })
  );
  return {
    mockFindUnique,
    mockCreditSourceCreate,
    mockCreditSourceAggregate,
    mockCreditTransactionCreate,
    mockTransaction,
  };
});

// Mock database module
vi.mock("@repo/database", () => ({
  database: {
    $transaction: mockTransaction,
    profile: { findUnique: mockFindUnique },
    creditSource: {
      create: mockCreditSourceCreate,
      aggregate: mockCreditSourceAggregate,
    },
    creditTransaction: { create: mockCreditTransactionCreate },
  },
}));

import { NoActiveSubscriptionError } from "../errors";
import { purchaseCreditPack } from "../pack-purchase";

describe("purchaseCreditPack", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should add credits with correct expiration", async () => {
    const profileId = "test-profile";
    const packId = "medium";

    // Mock active subscription
    mockFindUnique.mockResolvedValue({
      id: profileId,
      subscriptionStatus: "active",
    });

    mockCreditSourceAggregate.mockResolvedValue({
      _sum: { amount: 2600 },
    });

    mockCreditSourceCreate.mockResolvedValue({
      id: "source-pack",
      profileId,
      type: "pack",
      amount: 2500,
      initialAmount: 2500,
      packId: "medium",
      expiresAt: expect.any(Date),
    });

    mockCreditTransactionCreate.mockResolvedValue({
      id: "txn-pack",
      profileId,
      type: "pack_purchase",
      amount: 2500,
      balanceAfter: 2600,
    });

    const result = await purchaseCreditPack(profileId, packId);

    expect(result.creditsAdded).toBe(2500);
    expect(result.totalBalance).toBe(2600);
    expect(mockCreditSourceCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "pack",
          packId: "medium",
        }),
      })
    );
  });

  it("should require active subscription to purchase", async () => {
    const profileId = "test-profile-no-sub";

    // Mock no active subscription
    mockFindUnique.mockResolvedValue({
      id: profileId,
      subscriptionStatus: null,
    });

    await expect(purchaseCreditPack(profileId, "small")).rejects.toThrow(
      NoActiveSubscriptionError
    );
  });

  it("should reject with expired subscription", async () => {
    const profileId = "test-profile-expired";

    mockFindUnique.mockResolvedValue({
      id: profileId,
      subscriptionStatus: "expired",
    });

    await expect(purchaseCreditPack(profileId, "small")).rejects.toThrow(
      NoActiveSubscriptionError
    );
  });
});
