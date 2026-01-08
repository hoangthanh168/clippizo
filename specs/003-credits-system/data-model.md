# Data Model: Credits System

**Feature**: 003-credits-system
**Date**: 2026-01-08

## Overview

This document defines the database schema changes required for the credits system.

---

## New Entities

### CreditSource

Represents a pool of credits from a specific source (monthly allocation or pack purchase).

```prisma
model CreditSource {
  id          String   @id @default(cuid())
  profileId   String   @map("profile_id")
  profile     Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)

  type        String   // 'monthly' or 'pack'
  amount      Int      // Current remaining credits in this source
  initialAmount Int    @map("initial_amount") // Original allocation
  expiresAt   DateTime @map("expires_at")

  // For pack purchases only
  packId      String?  @map("pack_id")

  // For monthly allocations only
  billingCycleStart DateTime? @map("billing_cycle_start")

  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([profileId])
  @@index([profileId, type])
  @@index([expiresAt])
  @@map("credit_sources")
}
```

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| id | String | Primary key (cuid) |
| profileId | String | Foreign key to Profile |
| type | String | 'monthly' or 'pack' |
| amount | Int | Current remaining credits |
| initialAmount | Int | Original amount when created |
| expiresAt | DateTime | When these credits expire |
| packId | String? | Reference to pack type (small/medium/large) |
| billingCycleStart | DateTime? | Start of billing cycle (monthly only) |

**Indexes:**
- `profileId` - Fast lookup by user
- `profileId, type` - Filter by credit type
- `expiresAt` - Find expiring credits

---

### CreditTransaction

Audit log of all credit movements.

```prisma
model CreditTransaction {
  id          String   @id @default(cuid())
  profileId   String   @map("profile_id")
  profile     Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)

  type        String   // 'allocation' | 'pack_purchase' | 'consumption' | 'expiration' | 'adjustment'
  amount      Int      // Positive for additions, negative for deductions
  balanceAfter Int     @map("balance_after") // Total balance after this transaction

  // Context
  operation   String?  // e.g., 'image-gen-basic', 'video-gen-short'
  sourceId    String?  @map("source_id") // Reference to CreditSource
  description String?  // Human-readable description
  metadata    Json     @default("{}")

  createdAt   DateTime @default(now()) @map("created_at")

  @@index([profileId])
  @@index([profileId, createdAt])
  @@index([type])
  @@map("credit_transactions")
}
```

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| id | String | Primary key (cuid) |
| profileId | String | Foreign key to Profile |
| type | String | Transaction type |
| amount | Int | Credits added (positive) or removed (negative) |
| balanceAfter | Int | Total balance after transaction |
| operation | String? | Credit operation that consumed credits |
| sourceId | String? | Which CreditSource was affected |
| description | String? | Human-readable note |
| metadata | Json | Additional context (e.g., AI generation ID) |

**Transaction Types:**
- `allocation` - Monthly credits granted
- `pack_purchase` - Credit pack purchased
- `consumption` - Credits used for AI operation
- `expiration` - Credits expired (rollover cap or pack expiry)
- `adjustment` - Manual admin adjustment

---

## Extended Entities

### Profile (existing)

Add relation to credit entities:

```prisma
model Profile {
  // ... existing fields ...

  // NEW: Credit relations
  creditSources       CreditSource[]
  creditTransactions  CreditTransaction[]
}
```

---

## Configuration Types (not in database)

### SubscriptionPlan Extension

```typescript
// packages/payments/plans.ts
export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  priceVND: number;
  priceUSD: number;
  durationDays: number;
  features: string[];
  // NEW
  monthlyCredits: number;      // Credits per billing cycle
  rolloverCapMultiplier: number; // Max balance = monthlyCredits * multiplier
}
```

### Credit Pack Definition

```typescript
// packages/credits/packs.ts
export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceVND: number;
  priceUSD: number;
  validityDays: number;
}
```

### Credit Cost Definition

```typescript
// packages/credits/costs.ts
export interface CreditCost {
  operation: string;
  credits: number;
  description: string;
}
```

---

## Validation Rules

### CreditSource
- `amount` >= 0
- `initialAmount` > 0
- `expiresAt` > `createdAt`
- `type` must be 'monthly' or 'pack'
- If `type` = 'pack', `packId` must be set
- If `type` = 'monthly', `billingCycleStart` must be set

### CreditTransaction
- `type` must be valid transaction type
- `amount` != 0
- `balanceAfter` >= 0

---

## State Transitions

### Credit Source Lifecycle

```
┌─────────────┐
│   Created   │
│ (amount=N)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐     consumption
│   Active    │◄────────────────┐
│ (amount>0)  │                 │
└──────┬──────┘                 │
       │                        │
       │ amount=0 OR expired    │
       ▼                        │
┌─────────────┐                 │
│  Exhausted  │─────────────────┘
│ (amount=0)  │   (if has credits)
└─────────────┘
```

### Transaction Flow

```
User Action → Validate Balance → Deduct Credits → Log Transaction → Return Result
                    │
                    ▼
              Insufficient?
                    │
                    ▼
              Return Error
```

---

## Migration Strategy

1. **Add new tables** (non-breaking):
   - `credit_sources`
   - `credit_transactions`

2. **Add relations to Profile** (non-breaking):
   - No schema change needed, just Prisma relation

3. **Backfill existing users** (data migration):
   - Create initial `CreditSource` for active subscribers
   - Set `amount` based on plan's `monthlyCredits`
   - Set `expiresAt` to subscription expiry

---

## Queries

### Get Available Balance
```sql
SELECT SUM(amount) as total
FROM credit_sources
WHERE profile_id = $1
  AND amount > 0
  AND expires_at > NOW();
```

### Get Balance Breakdown
```sql
SELECT type, SUM(amount) as total, MIN(expires_at) as next_expiry
FROM credit_sources
WHERE profile_id = $1
  AND amount > 0
  AND expires_at > NOW()
GROUP BY type;
```

### Get Next Credits to Consume (Pack-First FIFO)
```sql
SELECT *
FROM credit_sources
WHERE profile_id = $1
  AND amount > 0
  AND expires_at > NOW()
ORDER BY type ASC, expires_at ASC
LIMIT 1;
```

### Get Transaction History
```sql
SELECT *
FROM credit_transactions
WHERE profile_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
```
