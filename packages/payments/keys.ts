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
      SEPAY_SECRET_KEY: z.string().optional(), // API secret for checkout signature
      SEPAY_IPN_SECRET: z.string().optional(), // IPN secret for webhook verification
      SEPAY_MODE: z.enum(["sandbox", "production"]).default("sandbox"),

      // Polar (optional for initial deployment)
      POLAR_ACCESS_TOKEN: z.string().optional(),
      POLAR_WEBHOOK_SECRET: z.string().optional(),
      POLAR_MODE: z.enum(["sandbox", "production"]).default("sandbox"),
      // Polar product IDs (from Polar dashboard)
      // Subscriptions - Monthly
      POLAR_PRODUCT_PRO: z.string().optional(),
      POLAR_PRODUCT_ENTERPRISE: z.string().optional(),
      // Subscriptions - Yearly
      POLAR_PRODUCT_PRO_YEARLY: z.string().optional(),
      POLAR_PRODUCT_ENTERPRISE_YEARLY: z.string().optional(),
      // Credit packs
      POLAR_PRODUCT_PACK_STARTER: z.string().optional(),
      POLAR_PRODUCT_PACK_SMALL: z.string().optional(),
      POLAR_PRODUCT_PACK_MEDIUM: z.string().optional(),
      POLAR_PRODUCT_PACK_LARGE: z.string().optional(),
      POLAR_PRODUCT_PACK_XLARGE: z.string().optional(),
      POLAR_PRODUCT_PACK_ENTERPRISE: z.string().optional(),
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
      SEPAY_IPN_SECRET: process.env.SEPAY_IPN_SECRET,
      SEPAY_MODE: process.env.SEPAY_MODE,

      // Polar
      POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
      POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET,
      POLAR_MODE: process.env.POLAR_MODE,
      POLAR_PRODUCT_PRO: process.env.POLAR_PRODUCT_PRO,
      POLAR_PRODUCT_ENTERPRISE: process.env.POLAR_PRODUCT_ENTERPRISE,
      POLAR_PRODUCT_PRO_YEARLY: process.env.POLAR_PRODUCT_PRO_YEARLY,
      POLAR_PRODUCT_ENTERPRISE_YEARLY: process.env.POLAR_PRODUCT_ENTERPRISE_YEARLY,
      POLAR_PRODUCT_PACK_STARTER: process.env.POLAR_PRODUCT_PACK_STARTER,
      POLAR_PRODUCT_PACK_SMALL: process.env.POLAR_PRODUCT_PACK_SMALL,
      POLAR_PRODUCT_PACK_MEDIUM: process.env.POLAR_PRODUCT_PACK_MEDIUM,
      POLAR_PRODUCT_PACK_LARGE: process.env.POLAR_PRODUCT_PACK_LARGE,
      POLAR_PRODUCT_PACK_XLARGE: process.env.POLAR_PRODUCT_PACK_XLARGE,
      POLAR_PRODUCT_PACK_ENTERPRISE: process.env.POLAR_PRODUCT_PACK_ENTERPRISE,
    },
  });
