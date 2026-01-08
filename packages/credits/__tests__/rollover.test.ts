import { beforeEach, describe, expect, it, vi } from "vitest";

// Use vi.hoisted to create mock functions that can be referenced in vi.mock
const {
  mockCreditSourceFindMany,
  mockCreditSourceUpdate,
  mockCreditSourceAggregate,
  mockCreditTransactionCreate,
  mockTransaction,
} = vi.hoisted(() => {
  const mockCreditSourceFindMany = vi.fn();
  const mockCreditSourceUpdate = vi.fn();
  const mockCreditSourceAggregate = vi.fn();
  const mockCreditTransactionCreate = vi.fn();
  const mockTransaction = vi.fn((callback: (tx: unknown) => unknown) =>
    callback({
      creditSource: {
        findMany: mockCreditSourceFindMany,
        update: mockCreditSourceUpdate,
        aggregate: mockCreditSourceAggregate,
      },
      creditTransaction: { create: mockCreditTransactionCreate },
    })
  );
  return {
    mockCreditSourceFindMany,
    mockCreditSourceUpdate,
    mockCreditSourceAggregate,
    mockCreditTransactionCreate,
    mockTransaction,
  };
});

// Mock database and payments modules
vi.mock("@repo/database", () => ({
  database: {
    $transaction: mockTransaction,
    creditSource: {
      findMany: mockCreditSourceFindMany,
      update: mockCreditSourceUpdate,
      aggregate: mockCreditSourceAggregate,
    },
    creditTransaction: { create: mockCreditTransactionCreate },
  },
}));

vi.mock("@repo/payments", () => ({
  getPlanRolloverCap: vi.fn(() => 1000),
}));

import { calculateRolloverCredits, expireExcessCredits } from "../expiration";

describe("calculateRolloverCredits", () => {
  it("should allow full rollover when within cap", () => {
    const result = calculateRolloverCredits(300, 500, 1000);
    expect(result.creditsToRollover).toBe(300);
    expect(result.creditsToExpire).toBe(0);
  });

  it("should calculate excess credits correctly when exceeding cap", () => {
    // Current: 700, New: 500, Cap: 1000
    // Total would be 1200, excess is 200
    const result = calculateRolloverCredits(700, 500, 1000);
    expect(result.creditsToExpire).toBe(200);
    expect(result.creditsToRollover).toBe(500); // 700 - 200
  });

  it("should handle case when already at cap", () => {
    const result = calculateRolloverCredits(1000, 500, 1000);
    expect(result.creditsToExpire).toBe(500);
    expect(result.creditsToRollover).toBe(500);
  });
});

describe("expireExcessCredits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should expire oldest monthly credits first", async () => {
    const profileId = "test-profile";

    mockCreditSourceFindMany.mockResolvedValue([
      {
        id: "source-old",
        profileId,
        type: "monthly",
        amount: 100,
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: "source-new",
        profileId,
        type: "monthly",
        amount: 200,
        expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      },
    ]);

    mockCreditSourceUpdate.mockResolvedValue({});
    mockCreditSourceAggregate.mockResolvedValue({
      _sum: { amount: 250 },
    });
    mockCreditTransactionCreate.mockResolvedValue({});

    const result = await expireExcessCredits(profileId, 50);

    expect(result.expiredCredits).toBe(50);
    expect(result.affectedSources).toContain("source-old");
  });

  it("should not expire pack credits during rollover", async () => {
    const profileId = "test-profile";

    // Only monthly credits should be returned (type filter in implementation)
    mockCreditSourceFindMany.mockResolvedValue([]);
    mockCreditSourceAggregate.mockResolvedValue({
      _sum: { amount: 0 },
    });

    const result = await expireExcessCredits(profileId, 100);

    expect(result.expiredCredits).toBe(0);
  });
});
