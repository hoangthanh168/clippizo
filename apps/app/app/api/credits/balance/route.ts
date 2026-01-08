import { auth } from "@repo/auth/server";
import { getCreditsBalance } from "@repo/credits";
import { database } from "@repo/database";
import { parseError } from "@repo/observability/error";
import { log } from "@repo/observability/log";
import { NextResponse } from "next/server";

export const GET = async (): Promise<Response> => {
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

    // Get credits balance with breakdown
    const balance = await getCreditsBalance(profile.id);

    return NextResponse.json(balance);
  } catch (error) {
    const message = parseError(error);
    log.error("Credits balance error", { error: message });

    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to get credits balance" },
      { status: 500 }
    );
  }
};
