import "server-only";
import {
  Client,
  Environment,
  LogLevel,
  OrdersController,
  CheckoutPaymentIntent,
  OrderApplicationContextLandingPage,
  OrderApplicationContextUserAction,
  type OrderRequest,
  type Order,
} from "@paypal/paypal-server-sdk";
import { keys } from "./keys";
import { type PlanId, getPlanPrice } from "./plans";

let client: Client | null = null;

function getClient(): Client {
  if (client) return client;

  const env = keys();
  const environment =
    env.PAYPAL_MODE === "live" ? Environment.Production : Environment.Sandbox;

  client = new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: env.PAYPAL_CLIENT_ID,
      oAuthClientSecret: env.PAYPAL_CLIENT_SECRET,
    },
    timeout: 30000,
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

  if (!order.id || !approvalLink?.href) {
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
