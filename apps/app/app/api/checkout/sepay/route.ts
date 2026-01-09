import { auth } from "@repo/auth/server";
import { database } from "@repo/database";
import { parseError } from "@repo/observability/error";
import { log } from "@repo/observability/log";
import { createSePayCheckout, isPaidPlan, type PlanId } from "@repo/payments";
import { NextResponse } from "next/server";

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
    const { plan, isRenewal } = body as {
      plan: string;
      isRenewal?: boolean;
    };

    if (!(plan && isPaidPlan(plan))) {
      return NextResponse.json(
        { message: "Invalid plan", ok: false },
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Generate invoice number first so we can include it in success URL
    const invoiceNumber = `CLZ-${Date.now()}-${profile.id.slice(-6)}`;

    const result = await createSePayCheckout({
      planId: plan as PlanId,
      profileId: profile.id,
      isRenewal,
      invoiceNumber,
      successUrl: `${baseUrl}/checkout/sepay/success?invoice=${invoiceNumber}`,
      errorUrl: `${baseUrl}/checkout/sepay/error`,
      cancelUrl: `${baseUrl}/checkout/sepay/cancel`,
    });

    log.info("SePay checkout created", {
      profileId: profile.id,
      plan,
      invoiceNumber: result.invoiceNumber,
    });

    return NextResponse.json({
      checkoutUrl: result.checkoutUrl,
      invoiceNumber: result.invoiceNumber,
      formFields: result.formFields,
      ok: true,
    });
  } catch (error) {
    const message = parseError(error);
    log.error("SePay checkout error", { error: message });

    return NextResponse.json(
      { message: "Failed to create checkout", ok: false },
      { status: 500 }
    );
  }
};
