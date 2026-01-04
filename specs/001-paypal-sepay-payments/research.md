# Research: PayPal & SePay Integration

**Feature**: 001-paypal-sepay-payments
**Date**: 2026-01-04
**Status**: Complete

## 1. PayPal Integration

### Decision
Use PayPal TypeScript Server SDK (@paypal/paypal-typescript-server-sdk) for one-time capture payments.

### Rationale
- Official TypeScript SDK with full type safety
- High source reputation (Context7 benchmark score: high)
- Supports one-time capture payments (not requiring recurring billing)
- Well-documented with 522 code snippets available

### Key Implementation Details

**Create Order Flow:**
- Use CheckoutPaymentIntent.Capture intent
- Pass purchaseUnits with amount (currencyCode: USD)
- Returns order ID for redirect to PayPal checkout

**Capture Order Flow:**
- Call captureOrder with order ID after user approves
- Returns captured payment details
- Update subscription on success

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| PayPal REST API direct | Less type safety, more boilerplate |
| Stripe | Not available in Vietnam |
| Paddle | Higher fees, less VN market support |

---

## 2. SePay Integration

### Decision
Use SePay Payment Gateway API with IPN (Instant Payment Notification) webhooks.

### Rationale
- Official Vietnamese payment gateway with bank partnerships
- Supports multiple payment methods: CARD, BANK_TRANSFER, NAPAS_BANK_TRANSFER
- VND currency support (essential for VN market)
- Webhook-based notification system (IPN)
- Free tier available, no monthly fees

### Key Implementation Details

**Checkout Init:**
- POST to https://pay-sandbox.sepay.vn/v1/checkout/init
- Form fields: merchant, currency, order_amount, operation, order_invoice_number
- Callback URLs: success_url, error_url, cancel_url
- HMAC-SHA256 signature required

**IPN Webhook:**
- notification_type: ORDER_PAID, TRANSACTION_VOID
- order object: id, order_status, order_amount, order_invoice_number
- transaction object: transaction_status, payment_method
- Verify X-Secret-Key header

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| VNPay | Higher integration complexity |
| MoMo | Limited to mobile payments |
| ZaloPay | Smaller merchant ecosystem |

---

## 3. Webhook Security

### Decision
Implement signature verification for both providers using HMAC-SHA256.

### Rationale
- Industry standard for webhook authenticity
- Both PayPal and SePay support signature verification
- Prevents replay attacks and data tampering

### Implementation
- SePay: X-Secret-Key header verification
- PayPal: PayPal-Transmission-Sig header verification

---

## 4. Idempotency Strategy

### Decision
Use providerTransactionId as idempotency key in Payment table.

### Rationale
- Provider transaction IDs are guaranteed unique
- Prevents duplicate subscription activations from webhook retries
- Simple database constraint enforcement

### Implementation
- Unique index on (provider, providerTransactionId)
- Check before processing webhook
- Return 200 OK for duplicates (no error)

---

## 5. Subscription Model

### Decision
Time-based subscription with manual renewal (not recurring billing).

### Rationale
- User explicitly stated: one-time payments, manual renewal
- Simpler implementation (no subscription management complexity)
- User controls renewal timing
- Avoids chargebacks from unexpected charges

### Implementation
- Profile.subscriptionExpiresAt: DateTime field
- Renewal extends from current expiry (not current date)
- Grace period: 0 days (immediate feature restriction)
- Read-only mode when expired (can view, cannot create)

---

## 6. Pricing Structure

### Decision
3-tier model: Free, Pro, Enterprise

| Tier | VND (SePay) | USD (PayPal) | Duration |
|------|-------------|--------------|----------|
| Free | 0 | 0 | Forever |
| Pro | 99,000 | 9.99 | 30 days |
| Enterprise | 299,000 | 29.99 | 30 days |

### Rationale
- Standard SaaS pricing model
- VND pricing aligned with VN market expectations
- 30-day duration allows monthly budgeting
