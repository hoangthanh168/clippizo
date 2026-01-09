import { auth } from "@repo/auth/server";
import { database } from "@repo/database";
import { parseError } from "@repo/observability/error";
import { log } from "@repo/observability/log";
import { NextResponse } from "next/server";

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
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
    const offset = Number(searchParams.get("offset")) || 0;

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

    const [payments, total] = await Promise.all([
      database.payment.findMany({
        where: { profileId: profile.id },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          amount: true,
          currency: true,
          provider: true,
          status: true,
          plan: true,
          createdAt: true,
        },
      }),
      database.payment.count({
        where: { profileId: profile.id },
      }),
    ]);

    return NextResponse.json({
      payments,
      total,
      limit,
      offset,
      ok: true,
    });
  } catch (error) {
    const message = parseError(error);
    log.error("Payments fetch error", { error: message });

    return NextResponse.json(
      { message: "Failed to fetch payments", ok: false },
      { status: 500 }
    );
  }
};
