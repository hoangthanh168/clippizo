import "server-only";
import crypto from "node:crypto";
import { keys } from "./keys";
import { type PlanId, getPlanPrice } from "./plans";

const SEPAY_SANDBOX_URL = "https://pay-sandbox.sepay.vn";
const SEPAY_PRODUCTION_URL = "https://pay.sepay.vn";

function getBaseUrl(): string {
  const env = keys();
  return env.SEPAY_MODE === "production"
    ? SEPAY_PRODUCTION_URL
    : SEPAY_SANDBOX_URL;
}

function generateSignature(data: string, secretKey: string): string {
  return crypto.createHmac("sha256", secretKey).update(data).digest("hex");
}

export interface CreateCheckoutParams {
  planId: PlanId;
  profileId: string;
  isRenewal?: boolean;
  successUrl: string;
  errorUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutResult {
  checkoutUrl: string;
  invoiceNumber: string;
}

export async function createSePayCheckout(
  params: CreateCheckoutParams
): Promise<CreateCheckoutResult> {
  const { planId, profileId, isRenewal, successUrl, errorUrl, cancelUrl } =
    params;
  const env = keys();

  if (!env.SEPAY_MERCHANT_ID || !env.SEPAY_SECRET_KEY) {
    throw new Error("SePay credentials not configured");
  }

  const amount = getPlanPrice(planId, "VND");
  const invoiceNumber = `CLZ-${Date.now()}-${profileId.slice(-6)}`;

  const formData: Record<string, string> = {
    merchant: env.SEPAY_MERCHANT_ID,
    currency: "VND",
    order_amount: amount.toString(),
    operation: "payment",
    order_invoice_number: invoiceNumber,
    order_description: `Clippizo ${planId} subscription${isRenewal ? " (renewal)" : ""}`,
    success_url: successUrl,
    error_url: errorUrl,
    cancel_url: cancelUrl,
    custom_data: JSON.stringify({ profileId, planId, isRenewal }),
  };

  // Create signature from sorted params
  const sortedKeys = Object.keys(formData).sort();
  const signatureData = sortedKeys.map((key) => formData[key]).join("");
  const signature = generateSignature(signatureData, env.SEPAY_SECRET_KEY);
  formData.signature = signature;

  // Build checkout URL with form submission
  const baseUrl = getBaseUrl();
  const checkoutUrl = `${baseUrl}/v1/checkout/init`;

  // For SePay, we need to POST the form data
  // Return URL for redirect-based checkout
  const urlParams = new URLSearchParams(formData);

  return {
    checkoutUrl: `${checkoutUrl}?${urlParams.toString()}`,
    invoiceNumber,
  };
}

export interface SePayIPNPayload {
  notification_type: "ORDER_PAID" | "TRANSACTION_VOID";
  order: {
    id: string;
    order_status: string;
    order_amount: number;
    order_invoice_number: string;
    custom_data?: string;
  };
  transaction: {
    transaction_id: string;
    transaction_status: string;
    payment_method: string;
    amount: number;
  };
}

export interface VerifyIPNResult {
  isValid: boolean;
  payload?: SePayIPNPayload;
  error?: string;
}

export function verifySePayIPN(
  secretKey: string,
  body: unknown
): VerifyIPNResult {
  const env = keys();

  if (!env.SEPAY_SECRET_KEY) {
    return { isValid: false, error: "SePay secret key not configured" };
  }

  // Verify secret key matches
  if (secretKey !== env.SEPAY_SECRET_KEY) {
    return { isValid: false, error: "Invalid secret key" };
  }

  // Parse and validate payload
  const payload = body as SePayIPNPayload;

  if (!payload.notification_type || !payload.order || !payload.transaction) {
    return { isValid: false, error: "Invalid payload structure" };
  }

  return { isValid: true, payload };
}

export interface ParsedCustomData {
  profileId: string;
  planId: PlanId;
  isRenewal: boolean;
}

export function parseSePayCustomData(
  customData?: string
): ParsedCustomData | null {
  if (!customData) return null;

  try {
    const parsed = JSON.parse(customData);
    return {
      profileId: parsed.profileId ?? "",
      planId: parsed.planId ?? "pro",
      isRenewal: parsed.isRenewal ?? false,
    };
  } catch {
    return null;
  }
}
