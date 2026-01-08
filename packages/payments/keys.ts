import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    server: {
      // PayPal (optional for initial deployment)
      PAYPAL_CLIENT_ID: z.string().optional(),
      PAYPAL_CLIENT_SECRET: z.string().optional(),
      PAYPAL_MODE: z.enum(["sandbox", "live"]).default("sandbox"),
      PAYPAL_WEBHOOK_ID: z.string().optional(),

      // SePay (optional for initial deployment)
      SEPAY_MERCHANT_ID: z.string().optional(),
      SEPAY_SECRET_KEY: z.string().optional(),
      SEPAY_MODE: z.enum(["sandbox", "production"]).default("sandbox"),
    },
    runtimeEnv: {
      // PayPal
      PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
      PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
      PAYPAL_MODE: process.env.PAYPAL_MODE,
      PAYPAL_WEBHOOK_ID: process.env.PAYPAL_WEBHOOK_ID,

      // SePay
      SEPAY_MERCHANT_ID: process.env.SEPAY_MERCHANT_ID,
      SEPAY_SECRET_KEY: process.env.SEPAY_SECRET_KEY,
      SEPAY_MODE: process.env.SEPAY_MODE,
    },
  });
