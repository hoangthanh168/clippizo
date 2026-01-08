# Research: Credits System

**Feature**: 003-credits-system
**Date**: 2026-01-08

## Overview

Research findings for implementing a credits-based usage system similar to ElevenLabs and Higgsfield.ai.

---

## 1. Atomic Credit Deduction Strategy

### Decision
Use Prisma interactive transactions with optimistic locking for atomic credit operations.

### Rationale
- Prisma transactions guarantee ACID properties
- Optimistic locking via version field prevents race conditions
- PostgreSQL row-level locks ensure no double-spend
- Matches existing database patterns in the codebase

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| Redis for credit balance | Adds complexity, requires sync with PostgreSQL |
| Application-level locking | Not reliable across multiple server instances |
| Database triggers | Less transparent, harder to test |

### Implementation Pattern
```typescript
await database.$transaction(async (tx) => {
  // 1. Read balance with lock
  const balance = await tx.creditSource.findFirst({
    where: { profileId, amount: { gt: 0 }, expiresAt: { gt: new Date() } },
    orderBy: [{ type: 'asc' }, { expiresAt: 'asc' }], // pack first, then FIFO
  });

  // 2. Validate sufficient credits
  if (!balance || balance.amount < cost) throw new InsufficientCreditsError();

  // 3. Deduct atomically
  await tx.creditSource.update({
    where: { id: balance.id },
    data: { amount: { decrement: cost } },
  });

  // 4. Log transaction
  await tx.creditTransaction.create({ ... });
});
```

---

## 2. Credit Source Priority (FIFO with Pack-First)

### Decision
Consume credit packs before monthly credits; within each type, consume oldest-expiring first.

### Rationale
- Protects user investment in purchased packs (they paid extra)
- Monthly credits auto-renew, so less urgent to use
- Matches user expectations from similar platforms (ElevenLabs)
- Clear, predictable behavior for users

### Implementation
```typescript
// Order: type ASC puts 'pack' before 'monthly', then expiresAt ASC for FIFO
orderBy: [
  { type: 'asc' },      // 'pack' < 'monthly' alphabetically
  { expiresAt: 'asc' }, // oldest expiring first
]
```

---

## 3. Rollover Cap Enforcement

### Decision
Enforce rollover cap at billing cycle renewal, expiring oldest credits first.

### Rationale
- Simple to implement: calculate total, expire excess
- Transparent to users: they see exactly when credits expire
- Matches ElevenLabs model where unused credits roll over with a cap

### Algorithm
```typescript
async function processRollover(profileId: string, newAllocation: number, cap: number) {
  const currentBalance = await getTotalBalance(profileId);
  const newTotal = currentBalance + newAllocation;

  if (newTotal > cap) {
    const excess = newTotal - cap;
    await expireOldestCredits(profileId, excess, 'monthly'); // Only expire monthly, not packs
  }

  await allocateCredits(profileId, newAllocation, 'monthly');
}
```

---

## 4. Credit Pack Expiration Independence

### Decision
Credit pack expiration is independent of billing cycle; tracked separately per purchase.

### Rationale
- User expectation: "90 days from purchase" is clear
- Simpler than tying to billing cycle
- Allows multiple packs with different expirations

### Data Model
```prisma
model CreditSource {
  type      String   // 'monthly' or 'pack'
  expiresAt DateTime // For monthly: next billing date; For pack: purchase + 90 days
  packId    String?  // Links to CreditPack if type='pack'
}
```

---

## 5. Credit Cost Configuration

### Decision
Store credit costs in a configuration file, not database.

### Rationale
- Costs change infrequently (business decision)
- Code-based config allows type safety and validation
- Easier to version control and audit changes
- Can be promoted to database later if dynamic pricing needed

### Configuration Pattern
```typescript
// packages/credits/costs.ts
export const CREDIT_COSTS = {
  'image-gen-basic': 10,
  'image-gen-premium': 25,
  'video-gen-short': 50,
  'video-gen-long': 100,
  'chatbot-message': 1,
} as const;

export type CreditOperation = keyof typeof CREDIT_COSTS;
```

---

## 6. Subscription Plan Extension

### Decision
Extend existing `SubscriptionPlan` type with `monthlyCredits` and `rolloverCap`.

### Rationale
- Builds on existing payments package
- Maintains single source of truth for plan definitions
- No breaking changes to existing code

### Updated Plan Structure
```typescript
export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  priceVND: number;
  priceUSD: number;
  durationDays: number;
  features: string[];
  // NEW
  monthlyCredits: number;
  rolloverCap: number; // multiplier of monthlyCredits
}

export const PLANS: Record<PlanId, SubscriptionPlan> = {
  free: { ..., monthlyCredits: 50, rolloverCap: 1 },
  pro: { ..., monthlyCredits: 500, rolloverCap: 2 },
  enterprise: { ..., monthlyCredits: 2000, rolloverCap: 2 },
};
```

---

## 7. Credit Pack Product Definitions

### Decision
Define credit packs as purchasable products with fixed amounts and validity.

### Rationale
- Simple, clear pricing for users
- Standard SaaS pattern (ElevenLabs, Higgsfield)
- Easy to add/remove tiers

### Product Structure
```typescript
export const CREDIT_PACKS = {
  small: { id: 'small', credits: 200, priceUSD: 4.99, priceVND: 49000, validityDays: 90 },
  medium: { id: 'medium', credits: 500, priceUSD: 9.99, priceVND: 99000, validityDays: 90 },
  large: { id: 'large', credits: 1200, priceUSD: 19.99, priceVND: 199000, validityDays: 90 },
} as const;
```

---

## 8. Webhook Integration for Credit Allocation

### Decision
Trigger credit allocation from existing payment webhook handlers.

### Rationale
- Reuses existing webhook infrastructure
- Single source of truth for payment completion
- Atomic with subscription activation

### Integration Points
- PayPal webhook: `PAYMENT.CAPTURE.COMPLETED` → allocate credits
- SePay webhook: Payment confirmed → allocate credits
- Subscription renewal: Same flow, called from `activateSubscription`

---

## 9. Low Credits Notification Strategy

### Decision
Check credits at consumption time and on dashboard load; no background job initially.

### Rationale
- Simpler than scheduled jobs
- Users see warning when it matters (using credits)
- Can add email notifications later via existing Resend integration

### Implementation
```typescript
async function checkLowCredits(profileId: string): Promise<boolean> {
  const balance = await getTotalBalance(profileId);
  const plan = await getSubscriptionPlan(profileId);
  const threshold = plan.monthlyCredits * 0.2; // 20%
  return balance < threshold;
}
```

---

## 10. Transaction Logging Requirements

### Decision
Log all credit transactions with full audit trail.

### Rationale
- Required for debugging and support
- Enables usage analytics
- Compliance and financial auditing

### Transaction Types
- `allocation` - Monthly credits added
- `pack_purchase` - Credit pack purchased
- `consumption` - Credits used
- `expiration` - Credits expired
- `adjustment` - Manual admin adjustment

---

## Summary

All technical unknowns resolved. Design follows existing codebase patterns:
- Prisma for database operations
- Zod for validation
- Existing webhook infrastructure
- Monorepo package structure

Ready to proceed to Phase 1: Data Model and Contracts.
