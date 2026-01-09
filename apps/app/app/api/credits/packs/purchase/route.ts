import { auth } from "@repo/auth/server";
import {
  getCreditPack,
  isValidPackId,
  purchasePackSchema,
} from "@repo/credits";
import { database } from "@repo/database";
import { parseError } from "@repo/observability/error";
import { log } from "@repo/observability/log";
import { createPayPalPackOrder, createSePayPackCheckout } from "@repo/payments";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const POST = async (request: Request): Promise<Response> => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Authentication required" },
        { status: 401 }
      );
    }

    // Get profile
    const profile = await database.profile.findUnique({
      where: { clerkUserId: userId },
      select: { id: true, subscriptionStatus: true },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Profile not found" },
        { status: 404 }
      );
    }

    // Verify active subscription
    const validStatuses = ["active", "trialing"];
    if (
      !(
        profile.subscriptionStatus &&
        validStatuses.includes(profile.subscriptionStatus)
      )
    ) {
      return NextResponse.json(
        {
          error: "NO_SUBSCRIPTION",
          message:
            "An active subscription is required to purchase credit packs",
        },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parsed = purchasePackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: "Invalid request body",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { packId, provider } = parsed.data;

    // Validate pack ID
    if (!isValidPackId(packId)) {
      return NextResponse.json(
        { error: "INVALID_PACK", message: `Invalid pack ID: ${packId}` },
        { status: 400 }
      );
    }

    const pack = getCreditPack(packId);
    const headersList = await headers();
    const host = headersList.get("host") ?? "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    if (provider === "paypal") {
      const result = await createPayPalPackOrder({
        packId: pack.id,
        packName: pack.name,
        priceUSD: pack.priceUSD,
        credits: pack.credits,
        profileId: profile.id,
        returnUrl: `${baseUrl}/credits/purchase/success?provider=paypal`,
        cancelUrl: `${baseUrl}/credits/purchase/cancel`,
      });

      log.info("PayPal pack order created", {
        profileId: profile.id,
        packId: pack.id,
        orderId: result.orderId,
      });

      return NextResponse.json({
        success: true,
        paymentUrl: result.approvalUrl,
        orderId: result.orderId,
      });
    }

    if (provider === "sepay") {
      const invoiceNumber = `CLZ-PACK-${Date.now()}-${profile.id.slice(-6)}`;

      const result = await createSePayPackCheckout({
        packId: pack.id,
        packName: pack.name,
        priceVND: pack.priceVND,
        credits: pack.credits,
        profileId: profile.id,
        invoiceNumber,
        successUrl: `${baseUrl}/credits/purchase/success?provider=sepay&invoice=${invoiceNumber}`,
        errorUrl: `${baseUrl}/credits/purchase/error`,
        cancelUrl: `${baseUrl}/credits/purchase/cancel`,
      });

      log.info("SePay pack checkout created", {
        profileId: profile.id,
        packId: pack.id,
        invoiceNumber: result.invoiceNumber,
      });

      return NextResponse.json({
        success: true,
        checkoutUrl: result.checkoutUrl,
        formFields: result.formFields,
        invoiceNumber: result.invoiceNumber,
      });
    }

    return NextResponse.json(
      { error: "INVALID_PROVIDER", message: "Invalid payment provider" },
      { status: 400 }
    );
  } catch (error) {
    const message = parseError(error);
    log.error("Pack purchase error", { error: message });

    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to initiate pack purchase" },
      { status: 500 }
    );
  }
};
