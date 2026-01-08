import { beforeEach, describe, expect, it, vi } from "vitest";

// Use vi.hoisted to create mock functions that can be referenced in vi.mock
const { mockPrisma } = vi.hoisted(() => {
  const mockCreditSourceFindMany = vi.fn();
  const mockCreditSourceFindFirst = vi.fn();
  const mockCreditSourceUpdate = vi.fn();
  const mockCreditSourceAggregate = vi.fn();
  const mockCreditTransactionCreate = vi.fn();
  const mockProfileFindUnique = vi.fn();

  const mockPrisma = {
    creditSource: {
      findMany: mockCreditSourceFindMany,
      findFirst: mockCreditSourceFindFirst,
      update: mockCreditSourceUpdate,
      aggregate: mockCreditSourceAggregate,
    },
    creditTransaction: {
      create: mockCreditTransactionCreate,
    },
    profile: {
      findUnique: mockProfileFindUnique,
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

// Import after mocking
import { consumeCredits } from "../consumption";
import { InsufficientCreditsError } from "../errors";

describe("consumeCredits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: active subscription
    mockPrisma.profile.findUnique.mockResolvedValue({
      subscriptionStatus: "active",
      subscriptionExpiresAt: new Date(Date.now() + 86_400_000 * 30),
    });
  });

  it("should consume credits for an operation", async () => {
    const profileId = "test-profile-123";
    const operation = "image-gen-basic"; // Costs 10 credits

    // Mock credit source with sufficient credits
    mockPrisma.creditSource.findMany.mockResolvedValue([
      {
        id: "source-1",
        profileId,
        type: "monthly",
        amount: 100,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ]);

    mockPrisma.creditSource.update.mockResolvedValue({
      id: "source-1",
      amount: 90,
    });

    mockPrisma.creditTransaction.create.mockResolvedValue({
      id: "txn-123",
      profileId,
      type: "consumption",
      amount: -10,
      balanceAfter: 90,
    });

    const result = await consumeCredits(profileId, operation);

    expect(result.success).toBe(true);
    expect(result.creditsUsed).toBe(10);
    expect(result.remainingBalance).toBe(90);
  });

  it("should throw InsufficientCreditsError when not enough credits", async () => {
    const profileId = "test-profile-456";
    const operation = "video-gen-long"; // Costs 100 credits

    // Mock credit source with insufficient credits
    mockPrisma.creditSource.findMany.mockResolvedValue([
      {
        id: "source-1",
        profileId,
        type: "monthly",
        amount: 50,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ]);

    await expect(consumeCredits(profileId, operation)).rejects.toThrow(
      InsufficientCreditsError
    );
  });
});

describe("FIFO pack-first consumption order", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should consume from pack credits before monthly credits", async () => {
    const profileId = "test-profile-pack";
    const operation = "image-gen-basic"; // Costs 10 credits

    // Mock sources: pack (50 credits) and monthly (100 credits)
    // Pack should be consumed first due to type ordering ('pack' < 'monthly')
    mockPrisma.creditSource.findMany.mockResolvedValue([
      {
        id: "source-pack",
        profileId,
        type: "pack",
        amount: 50,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
      {
        id: "source-monthly",
        profileId,
        type: "monthly",
        amount: 100,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ]);

    mockPrisma.creditSource.update.mockResolvedValue({
      id: "source-pack",
      amount: 40,
    });

    mockPrisma.creditTransaction.create.mockResolvedValue({
      id: "txn-pack",
      profileId,
      type: "consumption",
      amount: -10,
      balanceAfter: 140, // 40 pack + 100 monthly
    });

    const result = await consumeCredits(profileId, operation);

    expect(result.success).toBe(true);
    // Verify pack source was updated, not monthly
    expect(mockPrisma.creditSource.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "source-pack" },
      })
    );
  });

  it("should consume oldest-expiring credits first within same type", async () => {
    const profileId = "test-profile-fifo";
    const operation = "chatbot-message"; // Costs 1 credit

    const nearExpiry = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const farExpiry = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000);

    // Mock two monthly sources with different expiry dates
    mockPrisma.creditSource.findMany.mockResolvedValue([
      {
        id: "source-old",
        profileId,
        type: "monthly",
        amount: 50,
        expiresAt: nearExpiry, // Expires sooner
      },
      {
        id: "source-new",
        profileId,
        type: "monthly",
        amount: 100,
        expiresAt: farExpiry, // Expires later
      },
    ]);

    mockPrisma.creditSource.update.mockResolvedValue({
      id: "source-old",
      amount: 49,
    });

    mockPrisma.creditTransaction.create.mockResolvedValue({
      id: "txn-fifo",
      profileId,
      type: "consumption",
      amount: -1,
      balanceAfter: 149,
    });

    const result = await consumeCredits(profileId, operation);

    expect(result.success).toBe(true);
    // Verify older source was used first
    expect(mockPrisma.creditSource.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "source-old" },
      })
    );
  });
});

describe("insufficient credits handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should include required and available amounts in error", async () => {
    const profileId = "test-profile-error";
    const operation = "video-gen-short"; // Costs 50 credits

    mockPrisma.creditSource.findMany.mockResolvedValue([
      {
        id: "source-1",
        profileId,
        type: "monthly",
        amount: 30,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ]);

    try {
      await consumeCredits(profileId, operation);
      expect.fail("Should have thrown InsufficientCreditsError");
    } catch (error) {
      expect(error).toBeInstanceOf(InsufficientCreditsError);
      const insufficientError = error as InstanceType<
        typeof InsufficientCreditsError
      >;
      expect(insufficientError.required).toBe(50);
      expect(insufficientError.available).toBe(30);
    }
  });

  it("should throw error when no credit sources exist", async () => {
    const profileId = "test-profile-empty";
    const operation = "chatbot-message"; // Costs 1 credit

    mockPrisma.creditSource.findMany.mockResolvedValue([]);

    await expect(consumeCredits(profileId, operation)).rejects.toThrow(
      InsufficientCreditsError
    );
  });
});

describe("atomic deduction (concurrent requests)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should use database transaction for atomicity", async () => {
    const profileId = "test-profile-atomic";
    const operation = "image-gen-basic";

    mockPrisma.creditSource.findMany.mockResolvedValue([
      {
        id: "source-1",
        profileId,
        type: "monthly",
        amount: 100,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ]);

    mockPrisma.creditSource.update.mockResolvedValue({
      id: "source-1",
      amount: 90,
    });

    mockPrisma.creditTransaction.create.mockResolvedValue({
      id: "txn-atomic",
      profileId,
      type: "consumption",
      amount: -10,
      balanceAfter: 90,
    });

    await consumeCredits(profileId, operation);

    // Verify $transaction was called
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });
});
