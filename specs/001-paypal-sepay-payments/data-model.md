# Data Model: PayPal & SePay Payments

**Feature**: 001-paypal-sepay-payments
**Date**: 2026-01-04

## Entity Relationship Diagram

```
Profile 1──* Payment
   │
   └── plan, subscriptionStatus, subscriptionExpiresAt
```

## Entities

### Profile (existing - modified)

Updates to existing Profile model in packages/database/prisma/schema.prisma

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| plan | String | Current subscription tier | Default: "free", Enum: free/pro/enterprise |
| subscriptionStatus | String? | Subscription state | Enum: active/expired/cancelled |
| subscriptionExpiresAt | DateTime? | Subscription expiry timestamp | Nullable (null = free tier) |

**State Transitions:**
- free → active (after payment)
- active → expired (after expiresAt passes)
- expired → active (after renewal payment)
- active → cancelled (manual cancellation, no refund)

### Payment (new)

New model for payment transaction history.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | String | Primary key | CUID, auto-generated |
| profileId | String | FK to Profile | Required |
| amount | Decimal | Payment amount | Required, > 0 |
| currency | String | Currency code | Required, VND or USD |
| provider | String | Payment provider | Required, sepay or paypal |
| providerTransactionId | String | Provider's tx ID | Required, unique per provider |
| providerOrderId | String? | Provider's order ID | Optional |
| status | String | Payment status | pending/completed/failed/refunded |
| plan | String | Purchased plan tier | pro or enterprise |
| metadata | Json | Additional provider data | Default: {} |
| createdAt | DateTime | Creation timestamp | Auto-generated |
| updatedAt | DateTime | Update timestamp | Auto-updated |

**Indexes:**
- Unique: (provider, providerTransactionId) - idempotency
- Index: profileId - query by user
- Index: createdAt - sort by date

### SubscriptionPlan (config - not database)

Hardcoded configuration, not stored in database.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Plan identifier (free/pro/enterprise) |
| name | string | Display name |
| priceVND | number | Price in VND (SePay) |
| priceUSD | number | Price in USD (PayPal) |
| durationDays | number | Subscription duration |
| features | string[] | Included features |

**Configuration:**
```typescript
const PLANS = {
  free: { name: 'Free', priceVND: 0, priceUSD: 0, durationDays: 0, features: ['read-only'] },
  pro: { name: 'Pro', priceVND: 99000, priceUSD: 9.99, durationDays: 30, features: ['full-access'] },
  enterprise: { name: 'Enterprise', priceVND: 299000, priceUSD: 29.99, durationDays: 30, features: ['full-access', 'priority-support'] }
}
```

## Prisma Schema Changes

```prisma
// packages/database/prisma/schema.prisma

// Update Profile model
model Profile {
  // ... existing fields ...
  
  // Subscription fields (update)
  plan                 String    @default("free")
  subscriptionStatus   String?
  subscriptionExpiresAt DateTime?
  
  // Relations
  payments             Payment[]
}

// New Payment model
model Payment {
  id                    String   @id @default(cuid())
  profileId             String
  profile               Profile  @relation(fields: [profileId], references: [id])
  
  amount                Decimal
  currency              String
  provider              String
  providerTransactionId String
  providerOrderId       String?
  status                String   @default("pending")
  plan                  String
  metadata              Json     @default("{}")
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@unique([provider, providerTransactionId])
  @@index([profileId])
  @@index([createdAt])
  @@map("payments")
}
```

## Validation Rules

### Payment Creation
- amount > 0
- currency in ['VND', 'USD']
- provider in ['sepay', 'paypal']
- plan in ['pro', 'enterprise']
- providerTransactionId not empty

### Subscription Update
- subscriptionExpiresAt must be in future when setting to active
- plan must match purchased plan
- Cannot downgrade from enterprise to pro (new purchase required)

## Migration Strategy

1. Add new fields to Profile (nullable, with defaults)
2. Create Payment table
3. Migrate existing Stripe subscriptions (if any) to Payment records
4. Remove Stripe-specific fields from Profile
