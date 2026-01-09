import "server-only";
import { SePayPgClient } from "sepay-pg-node";
import { keys } from "./keys";
import { getPlanPrice, type PlanId } from "./plans";

function getClient(): SePayPgClient {
  const env = keys();

  if (!(env.SEPAY_MERCHANT_ID && env.SEPAY_SECRET_KEY)) {
    throw new Error("SePay credentials not configured");
  }

  return new SePayPgClient({
    env: env.SEPAY_MODE === "production" ? "production" : "sandbox",
    merchant_id: env.SEPAY_MERCHANT_ID,
    secret_key: env.SEPAY_SECRET_KEY,
  });
}

export interface CreateCheckoutParams {
  planId: PlanId;
  profileId: string;
  isRenewal?: boolean;
  invoiceNumber?: string;
  successUrl: string;
  errorUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutResult {
  checkoutUrl: string;
  invoiceNumber: string;
  formFields: Record<string, string>;
}

export async function createSePayCheckout(
  params: CreateCheckoutParams
): Promise<CreateCheckoutResult> {
  const {
    planId,
    profileId,
    isRenewal,
    invoiceNumber: providedInvoiceNumber,
    successUrl,
    errorUrl,
    cancelUrl,
  } = params;

  const client = getClient();
  const amount = getPlanPrice(planId, "VND");
  const invoiceNumber =
    providedInvoiceNumber ?? `CLZ-${Date.now()}-${profileId.slice(-6)}`;

  const formFields = client.checkout.initOneTimePaymentFields({
    order_invoice_number: invoiceNumber,
    order_amount: amount,
    currency: "VND",
    order_description: `Clippizo ${planId} subscription${isRenewal ? " (renewal)" : ""}`,
    success_url: successUrl,
    error_url: errorUrl,
    cancel_url: cancelUrl,
    custom_data: JSON.stringify({ profileId, planId, isRenewal }),
  });

  // Build checkout URL
  const checkoutUrl = client.checkout.initCheckoutUrl();

  // Convert formFields to Record<string, string> for form submission
  const formFieldsRecord: Record<string, string> = {};
  for (const [key, value] of Object.entries(formFields)) {
    if (value !== undefined && value !== null) {
      formFieldsRecord[key] = String(value);
    }
  }

  return {
    checkoutUrl,
    invoiceNumber,
    formFields: formFieldsRecord,
  };
}

export interface SePayIPNPayload {
  notification_type: "ORDER_PAID" | "RENEWAL_ORDER_PAID" | "TRANSACTION_VOID";
  order: {
    id: string;
    order_status: string;
    order_amount: number;
    order_invoice_number: string;
    custom_data?: string | Record<string, unknown>;
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

  if (!env.SEPAY_IPN_SECRET) {
    return { isValid: false, error: "SePay IPN secret not configured" };
  }

  // Verify secret key matches (IPN secret is different from API secret)
  if (secretKey !== env.SEPAY_IPN_SECRET) {
    return { isValid: false, error: "Invalid secret key" };
  }

  // Parse and validate payload
  const payload = body as SePayIPNPayload;

  if (!(payload.notification_type && payload.order && payload.transaction)) {
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
  customData?: string | Record<string, unknown>
): ParsedCustomData | null {
  if (!customData) return null;

  // SePay returns custom_data as parsed object, not string
  if (typeof customData === "object") {
    return {
      profileId: String(customData.profileId ?? ""),
      planId: (customData.planId as PlanId) ?? "pro",
      isRenewal: Boolean(customData.isRenewal),
    };
  }

  // Fallback: parse as JSON string
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

// ===========================================
// Credit Pack Purchase
// ===========================================

export interface CreatePackCheckoutParams {
  packId: string;
  packName: string;
  priceVND: number;
  credits: number;
  profileId: string;
  invoiceNumber?: string;
  successUrl: string;
  errorUrl: string;
  cancelUrl: string;
}

export interface CreatePackCheckoutResult {
  checkoutUrl: string;
  invoiceNumber: string;
  formFields: Record<string, string>;
}

export async function createSePayPackCheckout(
  params: CreatePackCheckoutParams
): Promise<CreatePackCheckoutResult> {
  const {
    packId,
    packName,
    priceVND,
    credits,
    profileId,
    invoiceNumber: providedInvoiceNumber,
    successUrl,
    errorUrl,
    cancelUrl,
  } = params;

  const client = getClient();
  const invoiceNumber =
    providedInvoiceNumber ?? `CLZ-PACK-${Date.now()}-${profileId.slice(-6)}`;

  const formFields = client.checkout.initOneTimePaymentFields({
    order_invoice_number: invoiceNumber,
    order_amount: priceVND,
    currency: "VND",
    order_description: `Clippizo ${packName} (${credits} credits)`,
    success_url: successUrl,
    error_url: errorUrl,
    cancel_url: cancelUrl,
    custom_data: JSON.stringify({ type: "pack", profileId, packId }),
  });

  // Build checkout URL
  const checkoutUrl = client.checkout.initCheckoutUrl();

  // Convert formFields to Record<string, string> for form submission
  const formFieldsRecord: Record<string, string> = {};
  for (const [key, value] of Object.entries(formFields)) {
    if (value !== undefined && value !== null) {
      formFieldsRecord[key] = String(value);
    }
  }

  return {
    checkoutUrl,
    invoiceNumber,
    formFields: formFieldsRecord,
  };
}

export interface ParsedPackCustomData {
  type: "pack";
  profileId: string;
  packId: string;
}

export function parseSePayPackCustomData(
  customData?: string | Record<string, unknown>
): ParsedPackCustomData | null {
  if (!customData) return null;

  // SePay returns custom_data as parsed object, not string
  if (typeof customData === "object") {
    if (customData.type !== "pack") return null;
    return {
      type: "pack",
      profileId: String(customData.profileId ?? ""),
      packId: String(customData.packId ?? ""),
    };
  }

  // Fallback: parse as JSON string
  try {
    const parsed = JSON.parse(customData);
    if (parsed.type !== "pack") return null;
    return {
      type: "pack",
      profileId: parsed.profileId ?? "",
      packId: parsed.packId ?? "",
    };
  } catch {
    return null;
  }
}
