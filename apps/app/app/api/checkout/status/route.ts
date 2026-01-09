import { auth } from "@repo/auth/server";
import { getCreditPack, isValidPackId } from "@repo/credits";
import { database } from "@repo/database";
import { parseError } from "@repo/observability/error";
import { log } from "@repo/observability/log";
import { getPlan, isPaidPlan } from "@repo/payments";
import { NextResponse } from "next/server";

export type CheckoutStatusResponse = {
  status: "pending" | "processing" | "completed" | "failed" | "expired" | "cancelled";
  payment?: {
    id: string;
    amount: number;
    currency: string;
    provider: string;
    productType: string;
    productName: string;
    invoiceNumber: string | null;
    createdAt: string;
  };
  error?: string;
  ok: true;
};

export const GET = async (request: Request): Promise<Response> => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized", ok: false },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { message: "Session ID required", ok: false },
        { status: 400 }
      );
    }

    const profile = await database.profile.findUnique({
      where: { clerkUserId: userId },
    });

    if (!profile) {
      return NextResponse.json(
        { message: "Profile not found", ok: false },
        { status: 404 }
      );
    }

    const session = await database.checkoutSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { message: "Session not found", ok: false },
        { status: 404 }
      );
    }

    // Security: Verify session belongs to this user
    if (session.profileId !== profile.id) {
      return NextResponse.json(
        { message: "Unauthorized", ok: false },
        { status: 403 }
      );
    }

    // Check if session has expired (but wasn't marked as expired yet)
    const now = new Date();
    if (session.status === "pending" && session.expiresAt < now) {
      await database.checkoutSession.update({
        where: { id: sessionId },
        data: { status: "expired" },
      });
      session.status = "expired";
    }

    // Get product name
    let productName = "Unknown";
    if (session.productType === "subscription" && isPaidPlan(session.productId)) {
      const plan = getPlan(session.productId);
      productName = plan?.name ?? "Subscription";
    } else if (session.productType === "credit_pack" && isValidPackId(session.productId)) {
      const pack = getCreditPack(session.productId as "small" | "medium" | "large");
      productName = pack.name;
    }

    const response: CheckoutStatusResponse = {
      status: session.status as CheckoutStatusResponse["status"],
      ok: true,
    };

    // If completed, fetch payment details
    if (session.status === "completed" && session.paymentId) {
      const payment = await database.payment.findUnique({
        where: { id: session.paymentId },
      });

      if (payment) {
        const metadata = (session.metadata ?? {}) as Record<string, unknown>;
        response.payment = {
          id: payment.id,
          amount: Number(payment.amount),
          currency: payment.currency,
          provider: payment.provider,
          productType: session.productType,
          productName,
          invoiceNumber: (metadata.invoiceNumber as string) ?? payment.providerOrderId ?? null,
          createdAt: payment.createdAt.toISOString(),
        };
      }
    }

    // If failed, include error message
    if (session.status === "failed") {
      const metadata = (session.metadata ?? {}) as Record<string, unknown>;
      response.error = (metadata.error as string) ?? "Payment failed";
    }

    return NextResponse.json(response);
  } catch (error) {
    const message = parseError(error);
    log.error("Checkout status error", { error: message });

    return NextResponse.json(
      { message: "Failed to get checkout status", ok: false },
      { status: 500 }
    );
  }
};
