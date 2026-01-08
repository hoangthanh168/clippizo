import { getAvailablePacks } from "@repo/credits";
import { NextResponse } from "next/server";

export const GET = async (): Promise<Response> => {
  const packs = getAvailablePacks();

  return NextResponse.json({
    packs: packs.map((pack) => ({
      id: pack.id,
      name: pack.name,
      credits: pack.credits,
      priceUSD: pack.priceUSD,
      priceVND: pack.priceVND,
      validityDays: pack.validityDays,
    })),
  });
};
