import "server-only";
import {
  CheckoutPaymentIntent,
  Client,
  Environment,
  LogLevel,
  type Order,
  OrderApplicationContextLandingPage,
  OrderApplicationContextUserAction,
  type OrderRequest,
  OrdersController,
} from "@paypal/paypal-server-sdk";
import { keys } from "./keys";
import { getPlanPrice, type PlanId } from "./plans";

let client: Client | null = null;

function getClient(): Client {
  if (client) return client;

  const env = keys();

  if (!(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET)) {
    throw new Error("PayPal credentials not configured");
  }

  const environment =
    env.PAYPAL_MODE === "live" ? Environment.Production : Environment.Sandbox;

  client = new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: env.PAYPAL_CLIENT_ID,
      oAuthClientSecret: env.PAYPAL_CLIENT_SECRET,
    },
    timeout: 30_000,
    environment,
    logging: {
      logLevel: LogLevel.Info,
      logRequest: { logBody: true },
      logResponse: { logHeaders: true },
    },
  });

  return client;
}

export interface CreateOrderParams {
  planId: PlanId;
  profileId: string;
  isRenewal?: boolean;
  returnUrl: string;
  cancelUrl: string;
}

export interface CreateOrderResult {
  orderId: string;
  approvalUrl: string;
}

export async function createPayPalOrder(
  params: CreateOrderParams
): Promise<CreateOrderResult> {
  const { planId, profileId, isRenewal, returnUrl, cancelUrl } = params;
  const amount = getPlanPrice(planId, "USD");

  const orderRequest: OrderRequest = {
    intent: CheckoutPaymentIntent.Capture,
    purchaseUnits: [
      {
        amount: {
          currencyCode: "USD",
          value: amount.toFixed(2),
        },
        description: `Clippizo ${planId} subscription${isRenewal ? " (renewal)" : ""}`,
        customId: JSON.stringify({ profileId, planId, isRenewal }),
      },
    ],
    applicationContext: {
      brandName: "Clippizo",
      landingPage: OrderApplicationContextLandingPage.Login,
      userAction: OrderApplicationContextUserAction.PayNow,
      returnUrl,
      cancelUrl,
    },
  };

  const ordersController = new OrdersController(getClient());
  const { result } = await ordersController.createOrder({
    body: orderRequest,
    prefer: "return=representation",
  });

  const order = result as Order;
  const approvalLink = order.links?.find((link) => link.rel === "approve");

  if (!(order.id && approvalLink?.href)) {
    throw new Error("Failed to create PayPal order");
  }

  return {
    orderId: order.id,
    approvalUrl: approvalLink.href,
  };
}

export interface CaptureOrderResult {
  transactionId: string;
  orderId: string;
  status: string;
  amount: number;
  currency: string;
  customData: {
    profileId: string;
    planId: PlanId;
    isRenewal: boolean;
  };
}

export async function capturePayPalOrder(
  orderId: string
): Promise<CaptureOrderResult> {
  const ordersController = new OrdersController(getClient());
  const { result } = await ordersController.captureOrder({
    id: orderId,
    prefer: "return=representation",
  });

  const order = result as Order;
  const capture = order.purchaseUnits?.[0]?.payments?.captures?.[0];
  const customId = order.purchaseUnits?.[0]?.customId;

  if (!capture?.id || order.status !== "COMPLETED") {
    throw new Error("Failed to capture PayPal payment");
  }

  const customData = customId
    ? JSON.parse(customId)
    : { profileId: "", planId: "pro", isRenewal: false };

  return {
    transactionId: capture.id,
    orderId: order.id ?? orderId,
    status: order.status ?? "COMPLETED",
    amount: Number.parseFloat(capture.amount?.value ?? "0"),
    currency: capture.amount?.currencyCode ?? "USD",
    customData,
  };
}

export async function getPayPalOrder(orderId: string): Promise<Order> {
  const ordersController = new OrdersController(getClient());
  const { result } = await ordersController.getOrder({ id: orderId });
  return result as Order;
}

// ===========================================
// Credit Pack Purchase
// ===========================================

export interface CreatePackOrderParams {
  packId: string;
  packName: string;
  priceUSD: number;
  credits: number;
  profileId: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface CreatePackOrderResult {
  orderId: string;
  approvalUrl: string;
}

export async function createPayPalPackOrder(
  params: CreatePackOrderParams
): Promise<CreatePackOrderResult> {
  const {
    packId,
    packName,
    priceUSD,
    credits,
    profileId,
    returnUrl,
    cancelUrl,
  } = params;

  const orderRequest: OrderRequest = {
    intent: CheckoutPaymentIntent.Capture,
    purchaseUnits: [
      {
        amount: {
          currencyCode: "USD",
          value: priceUSD.toFixed(2),
        },
        description: `Clippizo ${packName} (${credits} credits)`,
        customId: JSON.stringify({ type: "pack", profileId, packId }),
      },
    ],
    applicationContext: {
      brandName: "Clippizo",
      landingPage: OrderApplicationContextLandingPage.Login,
      userAction: OrderApplicationContextUserAction.PayNow,
      returnUrl,
      cancelUrl,
    },
  };

  const ordersController = new OrdersController(getClient());
  const { result } = await ordersController.createOrder({
    body: orderRequest,
    prefer: "return=representation",
  });

  const order = result as Order;
  const approvalLink = order.links?.find((link) => link.rel === "approve");

  if (!(order.id && approvalLink?.href)) {
    throw new Error("Failed to create PayPal pack order");
  }

  return {
    orderId: order.id,
    approvalUrl: approvalLink.href,
  };
}

export interface CapturePackOrderResult {
  transactionId: string;
  orderId: string;
  status: string;
  amount: number;
  currency: string;
  customData: {
    type: "pack";
    profileId: string;
    packId: string;
  };
}

export async function capturePayPalPackOrder(
  orderId: string
): Promise<CapturePackOrderResult> {
  const ordersController = new OrdersController(getClient());
  const { result } = await ordersController.captureOrder({
    id: orderId,
    prefer: "return=representation",
  });

  const order = result as Order;
  const capture = order.purchaseUnits?.[0]?.payments?.captures?.[0];
  const customId = order.purchaseUnits?.[0]?.customId;

  if (!capture?.id || order.status !== "COMPLETED") {
    throw new Error("Failed to capture PayPal pack payment");
  }

  const customData = customId
    ? JSON.parse(customId)
    : { type: "pack", profileId: "", packId: "" };

  return {
    transactionId: capture.id,
    orderId: order.id ?? orderId,
    status: order.status ?? "COMPLETED",
    amount: Number.parseFloat(capture.amount?.value ?? "0"),
    currency: capture.amount?.currencyCode ?? "USD",
    customData,
  };
}

// ===========================================
// Webhook Verification
// ===========================================

export interface WebhookVerificationParams {
  transmissionId: string;
  transmissionTime: string;
  certUrl: string;
  authAlgo: string;
  transmissionSig: string;
  webhookId: string;
  webhookEvent: unknown;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Verify PayPal webhook signature
 * Returns { isValid: true } if webhook ID is not configured (dev mode)
 */
export async function verifyPayPalWebhook(
  params: WebhookVerificationParams
): Promise<WebhookVerificationResult> {
  const env = keys();

  // Skip verification in dev if webhook ID not configured
  if (!env.PAYPAL_WEBHOOK_ID) {
    return { isValid: true };
  }

  if (!(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET)) {
    return { isValid: false, error: "PayPal credentials not configured" };
  }

  try {
    // Get access token
    const baseUrl =
      env.PAYPAL_MODE === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";

    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!authResponse.ok) {
      return { isValid: false, error: "Failed to get PayPal access token" };
    }

    const authData = (await authResponse.json()) as { access_token: string };

    // Verify webhook signature
    const verifyResponse = await fetch(
      `${baseUrl}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authData.access_token}`,
        },
        body: JSON.stringify({
          auth_algo: params.authAlgo,
          cert_url: params.certUrl,
          transmission_id: params.transmissionId,
          transmission_sig: params.transmissionSig,
          transmission_time: params.transmissionTime,
          webhook_id: params.webhookId,
          webhook_event: params.webhookEvent,
        }),
      }
    );

    if (!verifyResponse.ok) {
      return { isValid: false, error: "Webhook verification request failed" };
    }

    const verifyData = (await verifyResponse.json()) as {
      verification_status: string;
    };

    return {
      isValid: verifyData.verification_status === "SUCCESS",
      error:
        verifyData.verification_status !== "SUCCESS"
          ? `Verification status: ${verifyData.verification_status}`
          : undefined,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Extract webhook verification headers from request
 */
export function extractPayPalWebhookHeaders(headers: Headers): {
  transmissionId: string | null;
  transmissionTime: string | null;
  certUrl: string | null;
  authAlgo: string | null;
  transmissionSig: string | null;
} {
  return {
    transmissionId: headers.get("paypal-transmission-id"),
    transmissionTime: headers.get("paypal-transmission-time"),
    certUrl: headers.get("paypal-cert-url"),
    authAlgo: headers.get("paypal-auth-algo"),
    transmissionSig: headers.get("paypal-transmission-sig"),
  };
}
