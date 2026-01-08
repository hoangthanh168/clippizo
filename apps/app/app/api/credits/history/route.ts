import { auth } from "@repo/auth/server";
import { getTransactionHistory, transactionHistorySchema } from "@repo/credits";
import { database } from "@repo/database";
import { parseError } from "@repo/observability/error";
import { log } from "@repo/observability/log";
import { NextResponse } from "next/server";

export const GET = async (request: Request): Promise<Response> => {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const params = {
      limit: searchParams.get("limit")
        ? Number.parseInt(searchParams.get("limit") as string, 10)
        : undefined,
      offset: searchParams.get("offset")
        ? Number.parseInt(searchParams.get("offset") as string, 10)
        : undefined,
      type: searchParams.get("type") || undefined,
    };

    // Validate params
    const parsed = transactionHistorySchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    // Get transaction history
    const history = await getTransactionHistory(profile.id, parsed.data);

    return NextResponse.json(history);
  } catch (error) {
    const message = parseError(error);
    log.error("Credits history error", { error: message });

    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to get transaction history" },
      { status: 500 }
    );
  }
};
