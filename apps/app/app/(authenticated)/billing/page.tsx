"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface SubscriptionInfo {
  plan: string;
  status: string | null;
  expiresAt: string | null;
  isActive: boolean;
  canCreate: boolean;
  features: string[];
  daysRemaining: number | null;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  plan: string;
  createdAt: string;
}

export default function BillingPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null
  );
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [subRes, payRes] = await Promise.all([
          fetch("/api/subscription"),
          fetch("/api/payments?limit=10"),
        ]);

        if (subRes.ok) {
          const subData = await subRes.json();
          setSubscription(subData.subscription);
        }

        if (payRes.ok) {
          const payData = await payRes.json();
          setPayments(payData.payments || []);
        }
      } catch (error) {
        console.error("Failed to fetch billing data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "enterprise":
        return "bg-purple-100 text-purple-800";
      case "pro":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = () => {
    if (!subscription) return null;

    if (subscription.isActive) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <h1 className="mb-8 text-3xl font-bold">Billing</h1>

      {/* Current Subscription */}
      <div className="mb-8 rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Current Subscription</h2>
          {getStatusIcon()}
        </div>

        {subscription && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${getPlanBadgeColor(subscription.plan)}`}
              >
                {subscription.plan}
              </span>
              {subscription.status && (
                <span className="text-sm text-muted-foreground capitalize">
                  {subscription.status}
                </span>
              )}
            </div>

            {subscription.expiresAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {subscription.isActive ? "Expires" : "Expired"}:{" "}
                  {formatDate(subscription.expiresAt)}
                </span>
                {subscription.daysRemaining !== null &&
                  subscription.daysRemaining > 0 && (
                    <span className="ml-2 text-primary">
                      ({subscription.daysRemaining} days remaining)
                    </span>
                  )}
              </div>
            )}

            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium">Features:</h3>
              <ul className="space-y-1">
                {subscription.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="capitalize">
                      {feature.replace(/-/g, " ")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex gap-3">
              {subscription.plan === "free" ? (
                <button
                  type="button"
                  onClick={() => router.push("/pricing")}
                  className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
                >
                  Upgrade Plan
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => router.push("/pricing?renew=true")}
                    className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Renew Subscription
                  </button>
                  {subscription.plan === "pro" && (
                    <button
                      type="button"
                      onClick={() => router.push("/pricing?upgrade=enterprise")}
                      className="rounded-md border px-4 py-2 text-sm"
                    >
                      Upgrade to Enterprise
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Payment History</h2>
        </div>

        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments yet.</p>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded-md border p-4"
              >
                <div className="flex flex-col">
                  <span className="font-medium capitalize">{payment.plan}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(payment.createdAt)} via{" "}
                    {payment.provider.toUpperCase()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-medium">
                    {formatCurrency(Number(payment.amount), payment.currency)}
                  </span>
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs capitalize ${
                      payment.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
