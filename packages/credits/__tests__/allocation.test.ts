import { beforeEach, describe, expect, it, vi } from "vitest";

// Use vi.hoisted to create mock functions that can be referenced in vi.mock
const { mockPrisma } = vi.hoisted(() => {
  const mockCreditSourceFindMany = vi.fn();
  const mockCreditSourceCreate = vi.fn();
  const mockCreditSourceAggregate = vi.fn();
  const mockCreditTransactionCreate = vi.fn();

  const mockPrisma = {
    creditSource: {
      findMany: mockCreditSourceFindMany,
      create: mockCreditSourceCreate,
      aggregate: mockCreditSourceAggregate,
    },
    creditTransaction: {
      create: mockCreditTransactionCreate,
    },
    $transaction: vi.fn((callback: (tx: unknown) => unknown) =>
      callback(mockPrisma)
    ),
  };

  return { mockPrisma };
});

vi.mock("@repo/database", () => ({
  database: mockPrisma,
}));

// Mock @repo/payments
vi.mock("@repo/payments", () => ({
  getPlan: vi.fn((planId: string) => {
    const plans: Record<
      string,
      {
        id: string;
        name: string;
        durationDays: number;
        monthlyCredits: number;
        rolloverCapMultiplier: number;
      }
    > = {
      free: {
        id: "free",
        name: "Free",
        durationDays: 30,
        monthlyCredits: 50,
        rolloverCapMultiplier: 1,
      },
      pro: {
        id: "pro",
        name: "Pro",
        durationDays: 30,
        monthlyCredits: 500,
        rolloverCapMultiplier: 2,
      },
      enterprise: {
        id: "enterprise",
        name: "Enterprise",
        durationDays: 30,
        monthlyCredits: 2000,
        rolloverCapMultiplier: 2,
      },
    };
    return plans[planId];
  }),
  getPlanRolloverCap: vi.fn((planId: string) => {
    const caps: Record<string, number> = {
      free: 50, // 50 * 1
      pro: 1000, // 500 * 2
      enterprise: 4000, // 2000 * 2
    };
    return caps[planId] ?? 0;
  }),
}));

// Import after mocking
import { allocateMonthlyCredits } from "../allocation";

describe("allocateMonthlyCredits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allocate monthly credits for a new subscription", async () => {
    const profileId = "test-profile-123";
    const planId = "pro";
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    mockPrisma.creditSource.aggregate.mockResolvedValue({
      _sum: { amount: 0 },
    });

    mockPrisma.creditSource.create.mockResolvedValue({
      id: "source-123",
      profileId,
      type: "monthly",
      amount: 500,
      initialAmount: 500,
      expiresAt,
      billingCycleStart: now,
      createdAt: now,
      updatedAt: now,
    });

    mockPrisma.creditTransaction.create.mockResolvedValue({
      id: "txn-123",
      profileId,
      type: "allocation",
      amount: 500,
      balanceAfter: 500,
      description: "Monthly credit allocation for Pro plan",
      createdAt: now,
    });

    const result = await allocateMonthlyCredits(profileId, planId);

    expect(result.creditsAllocated).toBe(500);
    expect(result.totalBalance).toBe(500);
    expect(mockPrisma.creditSource.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          profileId,
          type: "monthly",
          amount: 500,
          initialAmount: 500,
        }),
      })
    );
  });

  it("should allocate free tier credits", async () => {
    const profileId = "test-profile-456";
    const planId = "free";

    mockPrisma.creditSource.aggregate.mockResolvedValue({
      _sum: { amount: 0 },
    });

    mockPrisma.creditSource.create.mockResolvedValue({
      id: "source-456",
      profileId,
      type: "monthly",
      amount: 50,
      initialAmount: 50,
      expiresAt: expect.any(Date),
      billingCycleStart: expect.any(Date),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });

    mockPrisma.creditTransaction.create.mockResolvedValue({
      id: "txn-456",
      profileId,
      type: "allocation",
      amount: 50,
      balanceAfter: 50,
      description: "Monthly credit allocation for Free plan",
      createdAt: expect.any(Date),
    });

    const result = await allocateMonthlyCredits(profileId, planId);

    expect(result.creditsAllocated).toBe(50);
  });

  it("should allocate enterprise tier credits", async () => {
    const profileId = "test-profile-789";
    const planId = "enterprise";

    mockPrisma.creditSource.aggregate.mockResolvedValue({
      _sum: { amount: 0 },
    });

    mockPrisma.creditSource.create.mockResolvedValue({
      id: "source-789",
      profileId,
      type: "monthly",
      amount: 2000,
      initialAmount: 2000,
      expiresAt: expect.any(Date),
      billingCycleStart: expect.any(Date),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });

    mockPrisma.creditTransaction.create.mockResolvedValue({
      id: "txn-789",
      profileId,
      type: "allocation",
      amount: 2000,
      balanceAfter: 2000,
      description: "Monthly credit allocation for Enterprise plan",
      createdAt: expect.any(Date),
    });

    const result = await allocateMonthlyCredits(profileId, planId);

    expect(result.creditsAllocated).toBe(2000);
  });
});

describe("rollover cap enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should enforce rollover cap when existing balance exceeds limit", async () => {
    const profileId = "test-profile-cap";
    const planId = "pro"; // 500 monthly, 2x cap = 1000 max

    // User has 800 existing credits
    mockPrisma.creditSource.aggregate.mockResolvedValue({
      _sum: { amount: 800 },
    });

    mockPrisma.creditSource.create.mockResolvedValue({
      id: "source-cap",
      profileId,
      type: "monthly",
      amount: 200, // Capped: 1000 - 800 = 200
      initialAmount: 500,
      expiresAt: expect.any(Date),
      billingCycleStart: expect.any(Date),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });

    mockPrisma.creditTransaction.create.mockResolvedValue({
      id: "txn-cap",
      profileId,
      type: "allocation",
      amount: 200,
      balanceAfter: 1000,
      description:
        "Monthly credit allocation for Pro plan (rollover cap applied)",
      createdAt: expect.any(Date),
    });

    const result = await allocateMonthlyCredits(profileId, planId);

    // Should allocate only enough to reach the cap
    expect(result.creditsAllocated).toBeLessThanOrEqual(500);
    expect(result.totalBalance).toBeLessThanOrEqual(1000);
  });

  it("should not allocate credits if already at cap", async () => {
    const profileId = "test-profile-maxed";
    const planId = "pro"; // 500 monthly, 2x cap = 1000 max

    // User already at cap
    mockPrisma.creditSource.aggregate.mockResolvedValue({
      _sum: { amount: 1000 },
    });

    mockPrisma.creditSource.create.mockResolvedValue({
      id: "source-maxed",
      profileId,
      type: "monthly",
      amount: 0,
      initialAmount: 500,
      expiresAt: expect.any(Date),
      billingCycleStart: expect.any(Date),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });

    mockPrisma.creditTransaction.create.mockResolvedValue({
      id: "txn-maxed",
      profileId,
      type: "allocation",
      amount: 0,
      balanceAfter: 1000,
      description: "Monthly credit allocation for Pro plan (at rollover cap)",
      createdAt: expect.any(Date),
    });

    const result = await allocateMonthlyCredits(profileId, planId);

    expect(result.creditsAllocated).toBe(0);
    expect(result.totalBalance).toBe(1000);
  });
});
