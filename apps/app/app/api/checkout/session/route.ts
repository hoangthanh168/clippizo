import { auth } from "@repo/auth/server";
import { getCreditPack, isValidPackId } from "@repo/credits";
import { database } from "@repo/database";
import { parseError } from "@repo/observability/error";
import { log } from "@repo/observability/log";
import {
  createPayPalOrder,
  createPayPalPackOrder,
  createSePayCheckout,
  createSePayPackCheckout,
  getPlan,
  isPaidPlan,
  keys,
  type PlanId,
} from "@repo/payments";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  type: z.enum(["subscription", "pack"]),
  productId: z.string(),
  provider: z.enum(["paypal", "sepay"]),
  isRenewal: z.boolean().optional().default(false),
});

export type CreateSessionResponse = {
  sessionId: string;
  expiresAt: string;
  paypal?: {
    clientId: string;
    orderId: string;
  };
  sepay?: {
    checkoutUrl: string;
    formFields: Record<string, string>;
  };
  ok: true;
};

export const POST = async (request: Request): Promise<Response> => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized", ok: false },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid request body", ok: false },
        { status: 400 }
      );
    }

    const { type, productId, provider, isRenewal } = parsed.data;

    // Validate product
    let amount: number;
    let currency: "VND" | "USD";

    if (type === "subscription") {
      if (!isPaidPlan(productId)) {
        return NextResponse.json(
          { message: "Invalid plan", ok: false },
          { status: 400 }
        );
      }
      const plan = getPlan(productId);
      if (!plan) {
        return NextResponse.json(
          { message: "Plan not found", ok: false },
          { status: 400 }
        );
      }
      amount = provider === "paypal" ? plan.priceUSD : plan.priceVND;
      currency = provider === "paypal" ? "USD" : "VND";
    } else {
      if (!isValidPackId(productId)) {
        return NextResponse.json(
          { message: "Invalid pack", ok: false },
          { status: 400 }
        );
      }
      const pack = getCreditPack(productId as "small" | "medium" | "large");
      amount = provider === "paypal" ? pack.priceUSD : pack.priceVND;
      currency = provider === "paypal" ? "USD" : "VND";
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

    // For pack purchases, verify subscription is active
    if (type === "pack") {
      const hasActiveSubscription =
        profile.subscriptionStatus === "active" ||
        profile.subscriptionStatus === "trialing";
      if (!hasActiveSubscription) {
        return NextResponse.json(
          {
            message: "Active subscription required to purchase credit packs",
            ok: false,
          },
          { status: 400 }
        );
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Create checkout session first (will update with provider order ID)
    const session = await database.checkoutSession.create({
      data: {
        profileId: profile.id,
        productType: type === "subscription" ? "subscription" : "credit_pack",
        productId,
        provider,
        amount,
        currency,
        status: "pending",
        expiresAt,
        metadata: { isRenewal },
      },
    });

    let providerOrderId: string;
    let responseData: CreateSessionResponse;

    if (provider === "paypal") {
      const env = keys();
      const clientId = env.PAYPAL_CLIENT_ID;

      if (!clientId) {
        await database.checkoutSession.update({
          where: { id: session.id },
          data: { status: "failed" },
        });
        return NextResponse.json(
          { message: "PayPal not configured", ok: false },
          { status: 500 }
        );
      }

      // Create PayPal order
      const result =
        type === "subscription"
          ? await createPayPalOrder({
              planId: productId as PlanId,
              profileId: profile.id,
              isRenewal,
              returnUrl: `${baseUrl}/checkout/success?session=${session.id}`,
              cancelUrl: `${baseUrl}/checkout/cancel?session=${session.id}`,
            })
          : await createPayPalPackOrder({
              packId: productId as "small" | "medium" | "large",
              profileId: profile.id,
              returnUrl: `${baseUrl}/checkout/success?session=${session.id}`,
              cancelUrl: `${baseUrl}/checkout/cancel?session=${session.id}`,
            });

      providerOrderId = result.orderId;

      // Update session with PayPal order ID
      await database.checkoutSession.update({
        where: { id: session.id },
        data: { providerOrderId },
      });

      responseData = {
        sessionId: session.id,
        expiresAt: expiresAt.toISOString(),
        paypal: {
          clientId,
          orderId: result.orderId,
        },
        ok: true,
      };
    } else {
      // SePay
      const invoiceNumber = `CLZ-${Date.now()}-${profile.id.slice(-6)}`;

      const result =
        type === "subscription"
          ? await createSePayCheckout({
              planId: productId as PlanId,
              profileId: profile.id,
              isRenewal,
              invoiceNumber,
              successUrl: `${baseUrl}/checkout/success?session=${session.id}`,
              errorUrl: `${baseUrl}/checkout/error?session=${session.id}`,
              cancelUrl: `${baseUrl}/checkout/cancel?session=${session.id}`,
            })
          : await createSePayPackCheckout({
              packId: productId as "small" | "medium" | "large",
              profileId: profile.id,
              invoiceNumber,
              successUrl: `${baseUrl}/checkout/success?session=${session.id}`,
              errorUrl: `${baseUrl}/checkout/error?session=${session.id}`,
              cancelUrl: `${baseUrl}/checkout/cancel?session=${session.id}`,
            });

      providerOrderId = invoiceNumber;

      // Update session with invoice number
      await database.checkoutSession.update({
        where: { id: session.id },
        data: {
          providerOrderId,
          metadata: { isRenewal, invoiceNumber },
        },
      });

      responseData = {
        sessionId: session.id,
        expiresAt: expiresAt.toISOString(),
        sepay: {
          checkoutUrl: result.checkoutUrl,
          formFields: result.formFields,
        },
        ok: true,
      };
    }

    log.info("Checkout session created", {
      sessionId: session.id,
      profileId: profile.id,
      type,
      productId,
      provider,
      providerOrderId,
    });

    return NextResponse.json(responseData);
  } catch (error) {
    const message = parseError(error);
    log.error("Checkout session creation error", { error: message });

    return NextResponse.json(
      { message: "Failed to create checkout session", ok: false },
      { status: 500 }
    );
  }
};
