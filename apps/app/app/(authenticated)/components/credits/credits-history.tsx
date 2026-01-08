"use client";

import type {
  CreditTransaction,
  TransactionHistoryResponse,
} from "@repo/credits";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
} from "lucide-react";
import { useState } from "react";

type CreditsHistoryProps = {
  initialHistory: TransactionHistoryResponse;
};

export function CreditsHistory({ initialHistory }: CreditsHistoryProps) {
  const [history, setHistory] = useState(initialHistory);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 10;

  const fetchPage = async (newOffset: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/credits/history?limit=${limit}&offset=${newOffset}`
      );
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
        setOffset(newOffset);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getTransactionIcon = (_type: string, amount: number) => {
    if (amount > 0) {
      return <ArrowUpCircle className="h-5 w-5 text-green-500" />;
    }
    return <ArrowDownCircle className="h-5 w-5 text-red-500" />;
  };

  const getTransactionLabel = (transaction: CreditTransaction) => {
    switch (transaction.type) {
      case "allocation":
        return "Monthly Credit Allocation";
      case "pack_purchase":
        return "Credit Pack Purchase";
      case "consumption":
        return transaction.operation
          ? `Used for ${transaction.operation.replace(/-/g, " ")}`
          : "Credits Consumed";
      case "expiration":
        return "Credits Expired";
      case "adjustment":
        return transaction.description || "Credit Adjustment";
      default:
        return transaction.description || "Transaction";
    }
  };

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(history.total / limit);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5" />
        <h2 className="font-semibold text-xl">Transaction History</h2>
      </div>

      {history.transactions.length === 0 ? (
        <p className="text-muted-foreground text-sm">No transactions yet.</p>
      ) : (
        <>
          <div className="space-y-3">
            {history.transactions.map((transaction) => (
              <div
                className="flex items-center justify-between rounded-md border p-4"
                key={transaction.id}
              >
                <div className="flex items-center gap-3">
                  {getTransactionIcon(transaction.type, transaction.amount)}
                  <div>
                    <span className="font-medium">
                      {getTransactionLabel(transaction)}
                    </span>
                    <p className="text-muted-foreground text-sm">
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`font-semibold text-lg ${
                      transaction.amount > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {transaction.amount > 0 ? "+" : ""}
                    {transaction.amount}
                  </span>
                  <p className="text-muted-foreground text-sm">
                    Balance: {transaction.balanceAfter}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
                  disabled={offset === 0 || loading}
                  onClick={() => fetchPage(offset - limit)}
                  type="button"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <button
                  className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
                  disabled={!history.hasMore || loading}
                  onClick={() => fetchPage(offset + limit)}
                  type="button"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}

          {loading ? (
            <div className="mt-4 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
