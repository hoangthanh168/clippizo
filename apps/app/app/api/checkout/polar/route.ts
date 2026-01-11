import { auth } from "@repo/auth/server";
import { database } from "@repo/database";
import { parseError } from "@repo/observability/error";
import { log } from "@repo/observability/log";
import {
  type BillingPeriod,
  createPolarCheckout,
  isPaidPlan,
  type PlanId,
} from "@repo/payments";
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
    const { plan, billingPeriod = "monthly" } = body as {
      plan: string;
      billingPeriod?: BillingPeriod;
    };

    // Validate billing period
    if (billingPeriod !== "monthly" && billingPeriod !== "yearly") {
      return NextResponse.json(
        { message: "Invalid billing period", ok: false },
        { status: 400 }
      );
    }

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

    const result = await createPolarCheckout({
      planId: plan as PlanId,
      billingPeriod,
      profileId: profile.id,
      successUrl: `${baseUrl}/checkout/polar/success`,
    });

    log.info("Polar checkout created", {
      profileId: profile.id,
      plan,
      billingPeriod,
      checkoutId: result.checkoutId,
    });

    return NextResponse.json({
      checkoutId: result.checkoutId,
      checkoutUrl: result.checkoutUrl,
      ok: true,
    });
  } catch (error) {
    const message = parseError(error);
    log.error("Polar checkout error", { error: message });

    return NextResponse.json(
      { message: "Failed to create checkout", ok: false },
      { status: 500 }
    );
  }
};
