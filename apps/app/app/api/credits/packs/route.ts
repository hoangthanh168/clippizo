import { getAvailablePacks, USD_TO_VND_RATE } from "@repo/credits";
import { NextResponse } from "next/server";

export const GET = async (): Promise<Response> => {
  const packs = getAvailablePacks();

  return NextResponse.json({
    packs: packs.map((pack) => ({
      id: pack.id,
      name: pack.name,
      credits: pack.credits,
      priceUSD: pack.priceUSD,
      priceVND: pack.priceUSD * USD_TO_VND_RATE,
      validityDays: pack.validityDays,
    })),
  });
};
