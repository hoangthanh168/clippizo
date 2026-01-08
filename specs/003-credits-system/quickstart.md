# Quickstart: Credits System

**Feature**: 003-credits-system
**Date**: 2026-01-08

## Overview

This guide provides a quick reference for implementing the credits system in Clippizo.

---

## Prerequisites

- Node.js 20+ LTS
- npm 10.8.1+
- PostgreSQL 15+ (via Supabase)
- Active Clippizo monorepo setup

---

## Setup Steps

### 1. Create the Credits Package

```bash
# From repo root
mkdir -p packages/credits
cd packages/credits
```

Create `package.json`:
```json
{
  "name": "@repo/credits",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "clean": "git clean -xdf .cache .turbo dist node_modules",
    "typecheck": "tsc --noEmit --emitDeclarationOnly false",
    "test": "vitest run"
  },
  "dependencies": {
    "@repo/database": "*",
    "@t3-oss/env-nextjs": "^0.13.8",
    "server-only": "^0.0.1",
    "zod": "^4.1.13"
  },
  "devDependencies": {
    "@repo/typescript-config": "*",
    "typescript": "^5.9.3",
    "vitest": "^4.0.15"
  }
}
```

### 2. Update Database Schema

Add to `packages/database/prisma/schema.prisma`:

```prisma
// Credit Sources (monthly allocations and pack purchases)
model CreditSource {
  id              String    @id @default(cuid())
  profileId       String    @map("profile_id")
  profile         Profile   @relation(fields: [profileId], references: [id], onDelete: Cascade)
  type            String    // 'monthly' or 'pack'
  amount          Int       // Current remaining credits
  initialAmount   Int       @map("initial_amount")
  expiresAt       DateTime  @map("expires_at")
  packId          String?   @map("pack_id")
  billingCycleStart DateTime? @map("billing_cycle_start")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  @@index([profileId])
  @@index([profileId, type])
  @@index([expiresAt])
  @@map("credit_sources")
}

// Credit Transaction Log
model CreditTransaction {
  id           String   @id @default(cuid())
  profileId    String   @map("profile_id")
  profile      Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  type         String   // 'allocation' | 'pack_purchase' | 'consumption' | 'expiration' | 'adjustment'
  amount       Int      // Positive for additions, negative for deductions
  balanceAfter Int      @map("balance_after")
  operation    String?  // e.g., 'image-gen-basic'
  sourceId     String?  @map("source_id")
  description  String?
  metadata     Json     @default("{}")
  createdAt    DateTime @default(now()) @map("created_at")

  @@index([profileId])
  @@index([profileId, createdAt])
  @@index([type])
  @@map("credit_transactions")
}
```

Add relations to Profile:
```prisma
model Profile {
  // ... existing fields ...
  creditSources       CreditSource[]
  creditTransactions  CreditTransaction[]
}
```

Run migration:
```bash
npm run migrate
```

### 3. Update Plans Configuration

Edit `packages/payments/plans.ts`:

```typescript
export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  priceVND: number;
  priceUSD: number;
  durationDays: number;
  features: string[];
  monthlyCredits: number;        // NEW
  rolloverCapMultiplier: number; // NEW
}

export const PLANS: Record<PlanId, SubscriptionPlan> = {
  free: {
    id: "free",
    name: "Free",
    priceVND: 0,
    priceUSD: 0,
    durationDays: 0,
    features: ["read-only"],
    monthlyCredits: 50,
    rolloverCapMultiplier: 1,
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceVND: 99000,
    priceUSD: 9.99,
    durationDays: 30,
    features: ["full-access", "unlimited-videos", "rag-search"],
    monthlyCredits: 500,
    rolloverCapMultiplier: 2,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceVND: 299000,
    priceUSD: 29.99,
    durationDays: 30,
    features: ["full-access", "unlimited-videos", "rag-search", "priority-support", "api-access"],
    monthlyCredits: 2000,
    rolloverCapMultiplier: 2,
  },
};
```

---

## Core API Usage

### Check Balance

```typescript
import { getCreditsBalance } from "@repo/credits";

const balance = await getCreditsBalance(profileId);
// { total: 450, breakdown: { monthly: 350, pack: 100 }, isLow: false }
```

### Consume Credits

```typescript
import { consumeCredits, InsufficientCreditsError } from "@repo/credits";

try {
  const result = await consumeCredits(profileId, "image-gen-basic", {
    generationId: "gen_123",
  });
  // { creditsUsed: 10, remainingBalance: 440, transactionId: "..." }
} catch (error) {
  if (error instanceof InsufficientCreditsError) {
    // Handle insufficient credits
    console.log(`Need ${error.required}, have ${error.available}`);
  }
}
```

### Allocate Monthly Credits

```typescript
import { allocateMonthlyCredits } from "@repo/credits";

// Called on subscription activation/renewal
await allocateMonthlyCredits(profileId, planId);
```

### Purchase Credit Pack

```typescript
import { purchaseCreditPack } from "@repo/credits";

// After payment confirmation
await purchaseCreditPack(profileId, "medium");
// Adds 500 credits with 90-day expiration
```

---

## Credit Costs Reference

| Operation | Credits | Description |
|-----------|---------|-------------|
| `image-gen-basic` | 10 | Basic AI image generation |
| `image-gen-premium` | 25 | Premium AI image generation |
| `video-gen-short` | 50 | Short video generation (<30s) |
| `video-gen-long` | 100 | Long video generation (30s+) |
| `chatbot-message` | 1 | AI chatbot interaction |

---

## Credit Pack Options

| Pack | Credits | Price (USD) | Price (VND) | Validity |
|------|---------|-------------|-------------|----------|
| Small | 200 | $4.99 | 49,000 | 90 days |
| Medium | 500 | $9.99 | 99,000 | 90 days |
| Large | 1,200 | $19.99 | 199,000 | 90 days |

---

## Testing

```bash
# Run credits package tests
npm run test --filter @repo/credits

# Run specific test file
npx vitest run packages/credits/__tests__/consumption.test.ts
```

### Key Test Cases

1. **Atomic consumption**: Verify no double-spend under concurrent requests
2. **FIFO expiration**: Verify oldest credits consumed first
3. **Pack priority**: Verify pack credits consumed before monthly
4. **Rollover cap**: Verify excess credits expire at cycle renewal
5. **Insufficient credits**: Verify proper error handling

---

## Common Issues

### Issue: Credits not allocated on subscription

**Check**: Webhook handler calls `allocateMonthlyCredits` after payment confirmation.

### Issue: Pack purchase fails

**Check**: User has active subscription (`subscriptionStatus === 'active'`).

### Issue: Race condition on credit consumption

**Check**: Using Prisma transaction with proper locking.

---

## Next Steps

1. Run `/speckit.tasks` to generate implementation tasks
2. Implement database schema changes first
3. Implement core credits package
4. Extend payment webhooks
5. Build UI components
6. Write tests
