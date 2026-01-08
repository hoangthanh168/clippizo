import { auth } from "@repo/auth/server";
import {
  consumeCredits,
  consumeCreditsSchema,
  InsufficientCreditsError,
  NoActiveSubscriptionError,
} from "@repo/credits";
import { database } from "@repo/database";
import { parseError } from "@repo/observability/error";
import { log } from "@repo/observability/log";
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
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Profile not found" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parsed = consumeCreditsSchema.safeParse(body);

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

    const { operation, metadata } = parsed.data;

    // Consume credits
    const result = await consumeCredits(profile.id, operation, metadata);

    log.info("Credits consumed", {
      profileId: profile.id,
      operation,
      creditsUsed: result.creditsUsed,
      remainingBalance: result.remainingBalance,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(
        {
          error: "INSUFFICIENT_CREDITS",
          message: error.message,
          required: error.required,
          available: error.available,
        },
        { status: 400 }
      );
    }

    if (error instanceof NoActiveSubscriptionError) {
      return NextResponse.json(
        {
          error: "NO_ACTIVE_SUBSCRIPTION",
          message: error.message,
        },
        { status: 403 }
      );
    }

    const message = parseError(error);
    log.error("Credits consume error", { error: message });

    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to consume credits" },
      { status: 500 }
    );
  }
};
