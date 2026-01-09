import { auth } from "@repo/auth/server";
import { database } from "@repo/database";
import { parseError } from "@repo/observability/error";
import { log } from "@repo/observability/log";
import { createPayPalOrder, isPaidPlan, type PlanId } from "@repo/payments";
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

    const result = await createPayPalOrder({
      planId: plan as PlanId,
      profileId: profile.id,
      isRenewal,
      returnUrl: `${baseUrl}/checkout/paypal/success`,
      cancelUrl: `${baseUrl}/checkout/paypal/cancel`,
    });

    log.info("PayPal order created", {
      profileId: profile.id,
      plan,
      orderId: result.orderId,
    });

    return NextResponse.json({
      orderId: result.orderId,
      approvalUrl: result.approvalUrl,
      ok: true,
    });
  } catch (error) {
    const message = parseError(error);
    log.error("PayPal checkout error", { error: message });

    return NextResponse.json(
      { message: "Failed to create order", ok: false },
      { status: 500 }
    );
  }
};
