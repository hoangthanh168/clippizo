# Tasks: PayPal & SePay One-Time Subscription Payments

**Feature**: 001-paypal-sepay-payments
**Date**: 2026-01-04
**Status**: Implementation Complete (Core Features)

## Task Dependency Graph

```
Phase 1: Setup
  T01 → T02 → T03 → T04 → T05

Phase 2: Foundational
  T06 → T07 → T08 → T09 → T10 → T11

Phase 3: US1 - SePay Purchase
  T12 → T13 → T14 → T15 → T16

Phase 4: US2 - PayPal Purchase
  T17 → T18 → T19 → T20 → T21

Phase 5: US3 - Manual Renewal
  T22 → T23 → T24 → T25

Phase 6: US4 - Subscription Status
  T26 → T27 → T28

Phase 7: US5 - Expiry Notification
  T29 → T30 → T31

Phase 8: Polish
  T32 → T33 → T34
```

---

## Phase 1: Setup

### T01: Install PayPal SDK
- **Priority**: P1
- **Story**: Setup
- **File**: packages/payments/package.json
- **Action**: Add @paypal/paypal-typescript-server-sdk dependency
- **Acceptance**: Package installed, types available

### T02: Create environment schema
- **Priority**: P1
- **Story**: Setup
- **File**: packages/payments/keys.ts
- **Action**: Add Zod schema for PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_MODE, SEPAY_MERCHANT_ID, SEPAY_SECRET_KEY, SEPAY_MODE
- **Acceptance**: Environment variables validated at startup

### T03: Update Prisma schema - Profile fields
- **Priority**: P1
- **Story**: Setup
- **File**: packages/database/prisma/schema.prisma
- **Action**: Add plan, subscriptionStatus, subscriptionExpiresAt fields to Profile model
- **Acceptance**: Fields added with correct types and defaults

### T04: Update Prisma schema - Payment model
- **Priority**: P1
- **Story**: Setup
- **File**: packages/database/prisma/schema.prisma
- **Action**: Create Payment model with idempotency constraint
- **Acceptance**: Model created with @@unique([provider, providerTransactionId])

### T05: Run database migration
- **Priority**: P1
- **Story**: Setup
- **File**: packages/database
- **Action**: npx prisma generate && npx prisma db push
- **Acceptance**: Database schema updated, Prisma client regenerated

---

## Phase 2: Foundational

### T06: Create subscription plans config
- **Priority**: P1
- **Story**: Foundational
- **File**: packages/payments/plans.ts
- **Action**: Export PLANS constant with Free, Pro, Enterprise tiers (VND/USD pricing)
- **Acceptance**: Plans config exported with correct prices

### T07: Create PayPal client wrapper
- **Priority**: P1
- **Story**: US2
- **File**: packages/payments/paypal.ts
- **Action**: Initialize PayPal SDK client with credentials, export createOrder and captureOrder functions
- **Acceptance**: PayPal client configured for sandbox/live mode

### T08: Create SePay client wrapper
- **Priority**: P1
- **Story**: US1
- **File**: packages/payments/sepay.ts
- **Action**: Create HMAC-SHA256 signature generator, checkout init function, IPN verification
- **Acceptance**: SePay API wrapper with signature support

### T09: Create subscription service
- **Priority**: P1
- **Story**: Foundational
- **File**: packages/payments/subscription.ts
- **Action**: Create activateSubscription, checkSubscriptionStatus, isFeatureAllowed functions
- **Acceptance**: Subscription logic centralized with Prisma integration

### T10: Export payment package
- **Priority**: P1
- **Story**: Foundational
- **File**: packages/payments/index.ts
- **Action**: Export all payment functions and types
- **Acceptance**: Clean barrel export for packages/payments

### T11: Add payment package tests
- **Priority**: P2
- **Story**: Foundational
- **File**: packages/payments/__tests__/
- **Action**: Unit tests for plans config, signature generation, subscription logic
- **Acceptance**: Core logic tested with mocks

---

## Phase 3: US1 - SePay Purchase (Vietnam)

### T12: Create SePay checkout route
- **Priority**: P1
- **Story**: US1
- **File**: apps/api/app/api/checkout/sepay/route.ts
- **Action**: POST handler that creates SePay checkout URL with HMAC signature
- **Acceptance**: Returns checkout URL for redirect

### T13: Create SePay webhook route
- **Priority**: P1
- **Story**: US1
- **File**: apps/api/app/api/webhooks/sepay/route.ts
- **Action**: POST handler that verifies X-Secret-Key, processes ORDER_PAID, creates Payment record, activates subscription
- **Acceptance**: Webhook processes payments idempotently

### T14: Create SePay success page
- **Priority**: P2
- **Story**: US1
- **File**: apps/app/app/checkout/sepay/success/page.tsx
- **Action**: Display payment confirmation, redirect to billing page
- **Acceptance**: User sees confirmation after payment

### T15: Create SePay cancel page
- **Priority**: P3
- **Story**: US1
- **File**: apps/app/app/checkout/sepay/cancel/page.tsx
- **Action**: Display cancellation message, link to retry
- **Acceptance**: User can retry payment

### T16: Add SePay integration tests
- **Priority**: P2
- **Story**: US1
- **File**: apps/api/__tests__/sepay.test.ts
- **Action**: Test checkout creation, webhook processing, idempotency
- **Acceptance**: SePay flow tested end-to-end

---

## Phase 4: US2 - PayPal Purchase (International)

### T17: Create PayPal checkout route
- **Priority**: P1
- **Story**: US2
- **File**: apps/api/app/api/checkout/paypal/route.ts
- **Action**: POST handler that creates PayPal order with CheckoutPaymentIntent.Capture
- **Acceptance**: Returns order ID for PayPal JS SDK

### T18: Create PayPal capture route
- **Priority**: P1
- **Story**: US2
- **File**: apps/api/app/api/checkout/paypal/capture/route.ts
- **Action**: POST handler that captures order, creates Payment record, activates subscription
- **Acceptance**: Captures payment and activates subscription

### T19: Create PayPal webhook route
- **Priority**: P1
- **Story**: US2
- **File**: apps/api/app/api/webhooks/paypal/route.ts
- **Action**: POST handler that verifies signature, handles PAYMENT.CAPTURE.COMPLETED
- **Acceptance**: Webhook as backup for capture route

### T20: Create PayPal checkout component
- **Priority**: P1
- **Story**: US2
- **File**: apps/app/app/pricing/components/paypal-button.tsx
- **Action**: PayPal JS SDK integration with createOrder and onApprove callbacks
- **Acceptance**: PayPal button works in sandbox

### T21: Add PayPal integration tests
- **Priority**: P2
- **Story**: US2
- **File**: apps/api/__tests__/paypal.test.ts
- **Action**: Test order creation, capture, webhook processing
- **Acceptance**: PayPal flow tested end-to-end

---

## Phase 5: US3 - Manual Renewal

### T22: Create renewal checkout logic
- **Priority**: P1
- **Story**: US3
- **File**: packages/payments/subscription.ts
- **Action**: Add renewSubscription function that extends from current expiresAt
- **Acceptance**: Renewal preserves remaining days

### T23: Add renewal button to billing page
- **Priority**: P1
- **Story**: US3
- **File**: apps/app/app/(authenticated)/billing/page.tsx
- **Action**: Show "Renew" button when subscription is active or expired
- **Acceptance**: Users can initiate renewal

### T24: Update checkout routes for renewal
- **Priority**: P1
- **Story**: US3
- **File**: apps/api/app/api/checkout/*/route.ts
- **Action**: Handle isRenewal flag, calculate correct expiresAt
- **Acceptance**: Renewal extends from current expiry

### T25: Add renewal tests
- **Priority**: P2
- **Story**: US3
- **File**: packages/payments/__tests__/renewal.test.ts
- **Action**: Test renewal date calculation, remaining days preservation
- **Acceptance**: Renewal logic tested

---

## Phase 6: US4 - Subscription Status

### T26: Create subscription API route
- **Priority**: P1
- **Story**: US4
- **File**: apps/api/app/api/subscription/route.ts
- **Action**: GET handler returning plan, status, expiresAt, features
- **Acceptance**: Returns current subscription details

### T27: Create billing page
- **Priority**: P1
- **Story**: US4
- **File**: apps/app/app/(authenticated)/billing/page.tsx
- **Action**: Display subscription status, expiry date, payment history, upgrade/renew buttons
- **Acceptance**: Users can view their subscription

### T28: Create payment history API route
- **Priority**: P2
- **Story**: US4
- **File**: apps/api/app/api/payments/route.ts
- **Action**: GET handler with pagination, returns user's payment records
- **Acceptance**: Payment history accessible

---

## Phase 7: US5 - Expiry Notification

### T29: Create expiry check function
- **Priority**: P2
- **Story**: US5
- **File**: packages/payments/subscription.ts
- **Action**: Add getExpiringSubscriptions function for batch checks
- **Acceptance**: Can query subscriptions expiring within N days

### T30: Create expiry notification email template
- **Priority**: P2
- **Story**: US5
- **File**: apps/email/emails/subscription-expiring.tsx
- **Action**: React Email template for expiry warning
- **Acceptance**: Email template renders correctly

### T31: Create expiry cron job
- **Priority**: P3
- **Story**: US5
- **File**: apps/api/app/api/cron/expiry-check/route.ts
- **Action**: Daily cron that checks expirations and sends emails
- **Acceptance**: Users notified before expiry

---

## Phase 8: Polish

### T32: Update pricing page
- **Priority**: P1
- **Story**: All
- **File**: apps/app/app/pricing/page.tsx
- **Action**: Show 3 plan tiers, SePay button (VND), PayPal button (USD)
- **Acceptance**: Users can select plan and payment method

### T33: Add feature gating middleware
- **Priority**: P1
- **Story**: US3
- **File**: apps/app/middleware.ts
- **Action**: Check subscription status, redirect to read-only mode if expired
- **Acceptance**: Expired users cannot create new content

### T34: Run security advisor check
- **Priority**: P2
- **Story**: All
- **File**: N/A
- **Action**: Use Supabase get_advisors for security review
- **Acceptance**: No critical security issues

---

## Summary

| Phase | Tasks | Priority Mix |
|-------|-------|--------------|
| 1. Setup | 5 | 5 P1 |
| 2. Foundational | 6 | 5 P1, 1 P2 |
| 3. US1 SePay | 5 | 2 P1, 2 P2, 1 P3 |
| 4. US2 PayPal | 5 | 4 P1, 1 P2 |
| 5. US3 Renewal | 4 | 3 P1, 1 P2 |
| 6. US4 Status | 3 | 2 P1, 1 P2 |
| 7. US5 Notification | 3 | 2 P2, 1 P3 |
| 8. Polish | 3 | 2 P1, 1 P2 |
| **Total** | **34** | **23 P1, 9 P2, 2 P3** |
