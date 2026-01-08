import { NextResponse } from "next/server";

export const GET = () =>
  NextResponse.json({
    name: "Clippizo API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/health",
      subscription: "/subscription",
      payments: "/payments",
      checkout: {
        paypal: "/checkout/paypal",
        sepay: "/checkout/sepay",
      },
      webhooks: {
        auth: "/webhooks/auth",
        paypal: "/webhooks/paypal",
        sepay: "/webhooks/sepay",
      },
    },
  });
