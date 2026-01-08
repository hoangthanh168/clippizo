import { beforeEach, describe, expect, it, vi } from "vitest";

// Create hoisted mocks
const { mockFindMany, mockCount, mockCreate } = vi.hoisted(() => {
  const mockFindMany = vi.fn();
  const mockCount = vi.fn();
  const mockCreate = vi.fn();
  return { mockFindMany, mockCount, mockCreate };
});

// Mock database
vi.mock("@repo/database", () => ({
  database: {
    creditTransaction: {
      findMany: mockFindMany,
      count: mockCount,
      create: mockCreate,
    },
  },
  Prisma: {
    InputJsonValue: {},
  },
}));

import {
  createTransaction,
  getRecentTransactions,
  getTransactionHistory,
} from "../transactions";

describe("Transaction History", () => {
  const mockProfileId = "profile-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTransactionHistory", () => {
    it("returns paginated transaction history with default params", async () => {
      const mockTransactions = [
        {
          id: "tx-1",
          profileId: mockProfileId,
          type: "consumption",
          amount: -10,
          balanceAfter: 490,
          operation: "image_generation",
          sourceId: "source-1",
          description: "Credits consumed for image_generation",
          metadata: {},
          createdAt: new Date("2024-01-15"),
        },
        {
          id: "tx-2",
          profileId: mockProfileId,
          type: "allocation",
          amount: 500,
          balanceAfter: 500,
          operation: null,
          sourceId: "source-2",
          description: "Monthly credit allocation",
          metadata: {},
          createdAt: new Date("2024-01-01"),
        },
      ];

      mockFindMany.mockResolvedValue(mockTransactions);
      mockCount.mockResolvedValue(2);

      const result = await getTransactionHistory(mockProfileId);

      expect(result.transactions).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);

      // Verify findMany was called with correct params
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { profileId: mockProfileId },
        orderBy: { createdAt: "desc" },
        take: 20, // default limit
        skip: 0, // default offset
      });
    });

    it("supports pagination with limit and offset", async () => {
      mockFindMany.mockResolvedValue([
        {
          id: "tx-3",
          profileId: mockProfileId,
          type: "consumption",
          amount: -5,
          balanceAfter: 485,
          operation: "chatbot",
          sourceId: null,
          description: "Credits consumed for chatbot",
          metadata: {},
          createdAt: new Date(),
        },
      ]);
      mockCount.mockResolvedValue(50);

      const result = await getTransactionHistory(mockProfileId, {
        limit: 10,
        offset: 20,
      });

      expect(mockFindMany).toHaveBeenCalledWith({
        where: { profileId: mockProfileId },
        orderBy: { createdAt: "desc" },
        take: 10,
        skip: 20,
      });

      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(50);
      expect(result.hasMore).toBe(true); // 20 + 1 < 50
    });

    it("filters by transaction type when provided", async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      await getTransactionHistory(mockProfileId, { type: "consumption" });

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          profileId: mockProfileId,
          type: "consumption",
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        skip: 0,
      });
    });

    it("returns hasMore=false when on last page", async () => {
      const mockTransactions = new Array(5).fill({
        id: "tx-x",
        profileId: mockProfileId,
        type: "consumption",
        amount: -1,
        balanceAfter: 499,
        operation: null,
        sourceId: null,
        description: null,
        metadata: {},
        createdAt: new Date(),
      });

      mockFindMany.mockResolvedValue(mockTransactions);
      mockCount.mockResolvedValue(15);

      const result = await getTransactionHistory(mockProfileId, {
        limit: 5,
        offset: 10,
      });

      // 10 + 5 = 15 = total, so hasMore should be false
      expect(result.hasMore).toBe(false);
    });

    it("maps transaction data correctly", async () => {
      const dbTransaction = {
        id: "tx-mapped",
        profileId: mockProfileId,
        type: "pack_purchase",
        amount: 1000,
        balanceAfter: 1500,
        operation: null,
        sourceId: "pack-source",
        description: "Purchased Starter Pack",
        metadata: { packId: "starter", price: 9.99 },
        createdAt: new Date("2024-02-01T10:00:00Z"),
      };

      mockFindMany.mockResolvedValue([dbTransaction]);
      mockCount.mockResolvedValue(1);

      const result = await getTransactionHistory(mockProfileId);

      expect(result.transactions[0]).toEqual({
        id: "tx-mapped",
        profileId: mockProfileId,
        type: "pack_purchase",
        amount: 1000,
        balanceAfter: 1500,
        operation: null,
        sourceId: "pack-source",
        description: "Purchased Starter Pack",
        metadata: { packId: "starter", price: 9.99 },
        createdAt: dbTransaction.createdAt,
      });
    });
  });

  describe("getRecentTransactions", () => {
    it("returns recent transactions with default limit of 10", async () => {
      const mockTransactions = new Array(10).fill(null).map((_, i) => ({
        id: `tx-${i}`,
        profileId: mockProfileId,
        type: "consumption",
        amount: -1,
        balanceAfter: 490 - i,
        operation: null,
        sourceId: null,
        description: null,
        metadata: {},
        createdAt: new Date(),
      }));

      mockFindMany.mockResolvedValue(mockTransactions);
      mockCount.mockResolvedValue(100);

      const result = await getRecentTransactions(mockProfileId);

      expect(result).toHaveLength(10);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });

    it("respects custom limit", async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      await getRecentTransactions(mockProfileId, 5);

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });
  });

  describe("createTransaction", () => {
    it("creates a transaction log entry", async () => {
      const createdTransaction = {
        id: "new-tx",
        profileId: mockProfileId,
        type: "consumption",
        amount: -25,
        balanceAfter: 475,
        operation: "video_generation",
        sourceId: "source-1",
        description: "Credits consumed for video_generation",
        metadata: { duration: 30 },
        createdAt: new Date(),
      };

      mockCreate.mockResolvedValue(createdTransaction);

      const result = await createTransaction(mockProfileId, {
        type: "consumption",
        amount: -25,
        balanceAfter: 475,
        operation: "video_generation",
        sourceId: "source-1",
        description: "Credits consumed for video_generation",
        metadata: { duration: 30 },
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          profileId: mockProfileId,
          type: "consumption",
          amount: -25,
          balanceAfter: 475,
          operation: "video_generation",
          sourceId: "source-1",
          description: "Credits consumed for video_generation",
          metadata: { duration: 30 },
        },
      });

      expect(result).toEqual({
        id: "new-tx",
        profileId: mockProfileId,
        type: "consumption",
        amount: -25,
        balanceAfter: 475,
        operation: "video_generation",
        sourceId: "source-1",
        description: "Credits consumed for video_generation",
        metadata: { duration: 30 },
        createdAt: createdTransaction.createdAt,
      });
    });

    it("uses empty object as default metadata", async () => {
      mockCreate.mockResolvedValue({
        id: "tx-no-meta",
        profileId: mockProfileId,
        type: "allocation",
        amount: 500,
        balanceAfter: 500,
        operation: null,
        sourceId: null,
        description: null,
        metadata: {},
        createdAt: new Date(),
      });

      await createTransaction(mockProfileId, {
        type: "allocation",
        amount: 500,
        balanceAfter: 500,
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: {},
        }),
      });
    });
  });
});
