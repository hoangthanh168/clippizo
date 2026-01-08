# Implementation Plan: Credits System

**Branch**: `003-credits-system` | **Date**: 2026-01-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-credits-system/spec.md`

## Summary

Implement a credits-based usage system for Clippizo AI video creation tools. Users receive monthly credits with their subscription (rollover up to 2x cap), can purchase additional credit packs (90-day expiration), and credits are consumed when using AI tools. Credit packs are consumed before monthly credits to protect paid top-ups.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+ LTS
**Primary Dependencies**: Next.js (App Router), Prisma ORM, PayPal SDK, Zod
**Storage**: PostgreSQL 15+ via Supabase (existing)
**Testing**: Vitest for unit/integration tests
**Target Platform**: Web (Vercel deployment)
**Project Type**: Monorepo (Turborepo) - apps + packages architecture
**Performance Goals**: Credit deductions <2s, dashboard load <3s, 100% transaction accuracy
**Constraints**: Atomic credit operations (no double-spend), FIFO consumption by expiration
**Scale/Scope**: Extends existing payments package, new credits package, UI in apps/app

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Fast
- [x] Build times under 60s for incremental changes (Turborepo caching)
- [x] HMR enabled for frontend development (Next.js default)
- [x] Non-blocking database migrations (Prisma with additive changes)
- [x] CI/CD feedback within 10 minutes (existing pipeline)

### II. Cheap
- [x] Uses existing PostgreSQL/Supabase (no new services)
- [x] No additional paid services required
- [x] Cost per user quantifiable (credits = usage = API costs)

### III. Opinionated
- [x] Uses existing stack: Next.js, Prisma, PayPal/SePay
- [x] No new package additions for core functionality
- [x] Follows existing monorepo patterns

### IV. Modern
- [x] TypeScript strict mode
- [x] Next.js App Router
- [x] Prisma for type-safe DB access

### V. Safe
- [x] Zod validation for all credit operations
- [x] Clerk authentication (existing)
- [x] Atomic database transactions for credit deductions
- [x] No secrets in code
- [x] Rate limiting via Arcjet (existing)

**Gate Status**: PASS - No violations

## Project Structure

### Documentation (this feature)

```text
specs/003-credits-system/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
packages/
├── credits/                    # NEW: Core credits logic
│   ├── index.ts               # Package exports
│   ├── keys.ts                # Environment validation
│   ├── balance.ts             # Credit balance operations
│   ├── consumption.ts         # Credit deduction logic
│   ├── allocation.ts          # Monthly credit allocation
│   ├── packs.ts               # Credit pack definitions and purchase
│   ├── transactions.ts        # Transaction logging
│   ├── expiration.ts          # Expiration and rollover logic
│   └── __tests__/             # Unit tests
│
├── payments/                   # EXTEND: Add credit pack purchases
│   ├── plans.ts               # Add monthlyCredits, rolloverCap
│   └── subscription.ts        # Hook credit allocation on activation
│
└── database/
    └── prisma/schema.prisma   # Add CreditBalance, CreditTransaction, CreditPack models

apps/app/
├── (authenticated)/
│   ├── credits/               # NEW: Credits dashboard page
│   │   └── page.tsx
│   └── settings/
│       └── billing/           # EXTEND: Add credit pack purchase UI
│
├── api/
│   ├── credits/               # NEW: Credits API routes
│   │   ├── balance/route.ts
│   │   ├── consume/route.ts
│   │   └── history/route.ts
│   └── webhooks/
│       └── payments/          # EXTEND: Trigger credit allocation
│
└── components/
    └── credits/               # NEW: Credits UI components
        ├── credits-balance.tsx
        ├── credits-history.tsx
        ├── credits-pack-card.tsx
        └── low-credits-warning.tsx
```

**Structure Decision**: Extends existing monorepo pattern. New `packages/credits` for core logic, extends `packages/payments` for plan configuration, adds UI components in `apps/app`.

## Complexity Tracking

> No violations - all designs follow existing patterns

## Post-Design Constitution Re-Check

*Re-evaluated after Phase 1 design completion.*

### I. Fast
- [x] New `packages/credits` follows existing package structure (fast builds)
- [x] Database migrations are additive only (non-blocking)
- [x] No new build dependencies

### II. Cheap
- [x] No new external services
- [x] Uses existing PostgreSQL, no Redis/cache layer needed
- [x] Credit costs configurable without infrastructure changes

### III. Opinionated
- [x] Follows existing monorepo conventions
- [x] Uses Prisma transactions (no custom locking mechanisms)
- [x] API routes follow existing patterns in apps/app

### IV. Modern
- [x] Full TypeScript with strict mode
- [x] Zod schemas for all API inputs
- [x] App Router for new pages

### V. Safe
- [x] Atomic transactions prevent double-spend
- [x] All endpoints protected by Clerk auth
- [x] Credit operations logged for audit trail
- [x] No secrets in code - uses existing env pattern

**Post-Design Gate Status**: PASS - Design maintains constitution compliance
