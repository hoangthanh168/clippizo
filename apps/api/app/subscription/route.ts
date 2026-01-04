import { auth } from "@repo/auth/server";
import { database } from "@repo/database";
import { parseError } from "@repo/observability/error";
import { log } from "@repo/observability/log";
import { getSubscriptionInfo } from "@repo/payments";
import { NextResponse } from "next/server";

export const GET = async (): Promise<Response> => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized", ok: false },
        { status: 401 }
      );
    }

    const profile = await database.profile.findUnique({
      where: { clerkUserId: userId },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json(
        { message: "Profile not found", ok: false },
        { status: 404 }
      );
    }

    const subscription = await getSubscriptionInfo(profile.id);

    return NextResponse.json({
      subscription,
      ok: true,
    });
  } catch (error) {
    const message = parseError(error);
    log.error("Subscription fetch error", { error: message });

    return NextResponse.json(
      { message: "Failed to fetch subscription", ok: false },
      { status: 500 }
    );
  }
};
