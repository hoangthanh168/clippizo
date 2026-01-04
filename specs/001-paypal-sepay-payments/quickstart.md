# Quickstart: PayPal & SePay Payments

**Feature**: 001-paypal-sepay-payments
**Date**: 2026-01-04

## Prerequisites

1. PayPal Business Account with REST API credentials
2. SePay Merchant Account with Payment Gateway enabled
3. Node.js 20+ and npm installed
4. Existing Clippizo development environment

## Environment Variables

Add to `packages/payments/.env` and `apps/api/.env.local`:

```bash
# PayPal
PAYPAL_CLIENT_ID="your_paypal_client_id"
PAYPAL_CLIENT_SECRET="your_paypal_client_secret"
PAYPAL_MODE="sandbox"  # or "live"

# SePay
SEPAY_MERCHANT_ID="your_merchant_id"
SEPAY_SECRET_KEY="your_secret_key"
SEPAY_MODE="sandbox"  # or "production"
```

## Installation

```bash
# Install PayPal SDK
cd packages/payments
npm install @paypal/paypal-typescript-server-sdk

# Generate Prisma client after schema changes
cd packages/database
npx prisma generate
npx prisma db push
```

## Testing Locally

### 1. Start Development Server

```bash
npm run dev --filter api
```

### 2. Test SePay Flow

- Navigate to pricing page
- Select Pro plan, click "Pay with SePay"
- Complete payment in SePay sandbox
- Verify webhook received at /api/webhooks/sepay

### 3. Test PayPal Flow

- Navigate to pricing page
- Select Pro plan, click "Pay with PayPal"
- Complete payment in PayPal sandbox
- Verify subscription activated

## Webhook Testing

### SePay Sandbox

1. Go to https://my.sepay.vn/pg/payment-methods
2. Enable sandbox mode
3. Use test cards from SePay documentation
4. Simulate transaction at https://docs.sepay.vn/gia-lap-giao-dich.html

### PayPal Sandbox

1. Go to https://developer.paypal.com/developer/accounts/
2. Create sandbox buyer account
3. Use sandbox credentials for testing
4. Monitor webhooks in PayPal Developer Dashboard

## Key Files

| File | Purpose |
|------|---------|
| packages/payments/paypal.ts | PayPal SDK wrapper |
| packages/payments/sepay.ts | SePay API wrapper |
| apps/api/app/webhooks/sepay/route.ts | SePay IPN handler |
| apps/api/app/webhooks/paypal/route.ts | PayPal webhook handler |
| apps/app/app/pricing/page.tsx | Pricing/checkout page |
| apps/app/app/(authenticated)/billing/page.tsx | Subscription status |

## Common Issues

### Webhook not received
- Check webhook URL is publicly accessible
- Verify signature/secret key configuration
- Check SePay/PayPal dashboard for delivery logs

### Payment not activating subscription
- Check Payment record created in database
- Verify providerTransactionId is unique
- Check logs for webhook processing errors

### Currency mismatch
- SePay only accepts VND
- PayPal defaults to USD
- Ensure correct provider is used for user locale
