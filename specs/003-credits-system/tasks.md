# Tasks: Credits System

**Input**: Design documents from `/specs/003-credits-system/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests included as the system handles financial transactions requiring high reliability.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo**: `packages/` for shared code, `apps/app/` for main application
- Based on plan.md project structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create `packages/credits` package structure and basic configuration

- [x] T001 Create `packages/credits/` directory structure with package.json, tsconfig.json
- [x] T002 [P] Create `packages/credits/keys.ts` with environment validation using @t3-oss/env-nextjs
- [x] T003 [P] Create `packages/credits/index.ts` barrel export file
- [x] T004 [P] Add `@repo/credits` to workspace dependencies in root package.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Add CreditSource model to `packages/database/prisma/schema.prisma` with indexes
- [x] T006 [P] Add CreditTransaction model to `packages/database/prisma/schema.prisma` with indexes
- [x] T007 Add Profile relation fields (creditSources, creditTransactions) to `packages/database/prisma/schema.prisma`
- [x] T008 (Requires DB connection - run npm run migrate when ready) Run Prisma migration: `npm run migrate` to apply schema changes
- [x] T009 Extend SubscriptionPlan interface with monthlyCredits and rolloverCapMultiplier in `packages/payments/plans.ts`
- [x] T010 [P] Add credit allocations to existing plans (free: 50, pro: 500, enterprise: 2000) in `packages/payments/plans.ts`
- [x] T011 [P] Create credit operation costs config in `packages/credits/costs.ts`
- [x] T012 [P] Create credit pack definitions in `packages/credits/packs.ts`
- [x] T013 [P] Create Zod validation schemas in `packages/credits/schemas.ts`
- [x] T014 [P] Create custom error classes (InsufficientCreditsError, NoActiveSubscriptionError) in `packages/credits/errors.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Monthly Credits Allocation (Priority: P1) 🎯 MVP

**Goal**: Subscribers receive designated monthly credits at subscription activation and billing cycle renewal

**Independent Test**: Subscribe to a plan and verify credits are allocated immediately

### Tests for User Story 1

- [x] T015 [P] [US1] Unit test for allocateMonthlyCredits in `packages/credits/__tests__/allocation.test.ts`
- [x] T016 [P] [US1] Unit test for rollover cap enforcement in `packages/credits/__tests__/allocation.test.ts`

### Implementation for User Story 1

- [x] T017 [US1] Implement getCreditsBalance function in `packages/credits/balance.ts`
- [x] T018 [US1] Implement allocateMonthlyCredits function in `packages/credits/allocation.ts` (creates CreditSource with type='monthly')
- [x] T019 [US1] Implement credit expiration logic for monthly credits in `packages/credits/expiration.ts`
- [x] T020 [US1] Implement createTransaction helper in `packages/credits/transactions.ts`
- [x] T021 [US1] Hook allocateMonthlyCredits into subscription activation webhook in `apps/app/api/webhooks/payments/route.ts`
- [x] T022 [US1] Add billing cycle renewal handling in webhook to allocate new monthly credits

**Checkpoint**: At this point, users receive credits when subscribing and at billing cycle renewal

---

## Phase 4: User Story 2 - Credits Consumption (Priority: P1) 🎯 MVP

**Goal**: Credits are atomically deducted when using AI tools with proper FIFO ordering (pack-first)

**Independent Test**: Use an AI tool and verify correct amount deducted with pack-first priority

### Tests for User Story 2

- [x] T023 [P] [US2] Unit test for consumeCredits in `packages/credits/__tests__/consumption.test.ts`
- [x] T024 [P] [US2] Unit test for FIFO pack-first consumption order in `packages/credits/__tests__/consumption.test.ts`
- [x] T025 [P] [US2] Unit test for insufficient credits handling in `packages/credits/__tests__/consumption.test.ts`
- [x] T026 [P] [US2] Unit test for atomic deduction (concurrent requests) in `packages/credits/__tests__/consumption.test.ts`

### Implementation for User Story 2

- [x] T027 [US2] Implement consumeCredits function with Prisma transaction in `packages/credits/consumption.ts`
- [x] T028 [US2] Implement pack-first FIFO ordering: `orderBy: [{ type: 'asc' }, { expiresAt: 'asc' }]` in consumption logic
- [x] T029 [US2] Create POST `/api/credits/consume` route in `apps/app/api/credits/consume/route.ts`
- [x] T030 [US2] Add Clerk auth middleware to consume endpoint
- [x] T031 [US2] Integrate credit consumption into existing AI tool endpoints (image-gen, video-gen, chatbot)

**Checkpoint**: At this point, credits are consumed correctly when using AI tools with atomic deduction

---

## Phase 5: User Story 3 - Credits Rollover (Priority: P2)

**Goal**: Unused credits roll over to next billing cycle up to a configurable cap (2x monthly by default)

**Independent Test**: Let billing cycle pass with unused credits and verify rollover amount respects cap

### Tests for User Story 3

- [x] T032 [P] [US3] Unit test for rollover within cap in `packages/credits/__tests__/rollover.test.ts`
- [x] T033 [P] [US3] Unit test for rollover exceeding cap (excess expires) in `packages/credits/__tests__/rollover.test.ts`

### Implementation for User Story 3

- [x] T034 [US3] Implement calculateRolloverCredits function in `packages/credits/expiration.ts`
- [x] T035 [US3] Implement expireExcessCredits function in `packages/credits/expiration.ts`
- [x] T036 [US3] Update allocateMonthlyCredits to handle rollover cap at cycle renewal in `packages/credits/allocation.ts`
- [x] T037 [US3] Log expiration transactions when credits exceed rollover cap

**Checkpoint**: At this point, credits roll over correctly with cap enforcement

---

## Phase 6: User Story 4 - Credit Pack Purchase (Priority: P2)

**Goal**: Subscribers can purchase additional credit packs with 90-day expiration

**Independent Test**: Purchase a credit pack and verify credits added with correct expiration

### Tests for User Story 4

- [x] T038 [P] [US4] Unit test for purchaseCreditPack in `packages/credits/__tests__/packs.test.ts`
- [x] T039 [P] [US4] Unit test for subscription validation (pack purchase requires active subscription) in `packages/credits/__tests__/packs.test.ts`

### Implementation for User Story 4

- [x] T040 [US4] Implement purchaseCreditPack function in `packages/credits/packs.ts` (creates CreditSource with type='pack')
- [x] T041 [US4] Implement validateActiveSubscription check in pack purchase flow
- [x] T042 [US4] Create GET `/api/credits/packs` route listing available packs in `apps/app/api/credits/packs/route.ts`
- [x] T043 [US4] Create POST `/api/credits/packs/purchase` route in `apps/app/api/credits/packs/purchase/route.ts`
- [x] T044 [US4] Integrate PayPal payment flow for credit pack purchase
- [x] T045 [US4] Integrate SePay payment flow for credit pack purchase
- [x] T046 [US4] Handle payment webhook to finalize credit pack addition

**Checkpoint**: At this point, users can purchase credit packs with proper payment integration

---

## Phase 7: User Story 5 - Credits Dashboard (Priority: P3)

**Goal**: Users can view credits balance, breakdown, history, and expiration warnings in a dashboard

**Independent Test**: Navigate to dashboard and verify accurate display of all credit information

### Tests for User Story 5

- [x] T047 [P] [US5] Unit test for getTransactionHistory in `packages/credits/__tests__/transactions.test.ts`

### Implementation for User Story 5

- [x] T048 [US5] Create GET `/api/credits/balance` route in `apps/app/api/credits/balance/route.ts`
- [x] T049 [US5] Implement getTransactionHistory function with pagination in `packages/credits/transactions.ts`
- [x] T050 [US5] Create GET `/api/credits/history` route in `apps/app/api/credits/history/route.ts`
- [x] T051 [US5] Create `apps/app/components/credits/credits-balance.tsx` component showing total and breakdown
- [x] T052 [US5] Create `apps/app/components/credits/credits-history.tsx` component with transaction list
- [x] T053 [US5] Create `apps/app/components/credits/credits-pack-card.tsx` component for pack purchase UI
- [x] T054 [US5] Create `apps/app/components/credits/low-credits-warning.tsx` component (below 20% threshold)
- [x] T055 [US5] Create `apps/app/components/credits/expiring-credits-warning.tsx` component (within 7 days)
- [x] T056 [US5] Create credits dashboard page at `apps/app/(authenticated)/credits/page.tsx`
- [x] T057 [US5] Add credits balance indicator to main navigation/header

**Checkpoint**: At this point, users have full visibility into their credits status

---

## Phase 8: User Story 6 - Subscription Cancellation Credits Handling (Priority: P3)

**Goal**: Handle credits correctly when subscription is cancelled or becomes inactive

**Independent Test**: Cancel subscription and verify credit behavior through end of billing period

### Tests for User Story 6

- [x] T058 [P] [US6] Unit test for credits availability after cancellation (until period end) in `packages/credits/__tests__/subscription.test.ts`
- [x] T059 [P] [US6] Unit test for credits forfeiture after subscription ends in `packages/credits/__tests__/subscription.test.ts`

### Implementation for User Story 6

- [x] T060 [US6] Implement handleSubscriptionCancellation function in `packages/credits/subscription.ts`
- [x] T061 [US6] Implement forfeitAllCredits function in `packages/credits/subscription.ts`
- [x] T062 [US6] Add subscription status check to credit consumption (allow if within billing period)
- [x] T063 [US6] Handle subscription ended webhook to forfeit credits in `apps/app/api/webhooks/payments/route.ts`
- [x] T064 [US6] Implement grace period logic (3 days) for payment failures in `packages/credits/subscription.ts`

**Checkpoint**: At this point, subscription lifecycle events are handled correctly for credits

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T065 [P] Add credit pack purchase UI to billing settings page at `apps/app/(authenticated)/settings/billing/`
- [x] T066 [P] Run security advisor check with `mcp__plugin_supabase_supabase__get_advisors` for new tables
- [x] T067 Verify atomic transaction handling under concurrent load
- [x] T068 [P] Run quickstart.md validation - test all documented API examples
- [x] T069 Update `@repo/credits` package exports in index.ts with all public functions
- [x] T070 [P] Add database indexes optimization if needed based on query patterns

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - US1 and US2 are P1 (MVP) - complete first
  - US3 and US4 are P2 - complete after P1
  - US5 and US6 are P3 - complete last
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (Monthly Allocation)**: Foundation only - MVP critical
- **US2 (Consumption)**: Foundation + US1 (needs credits to consume) - MVP critical
- **US3 (Rollover)**: US1 (extends allocation logic)
- **US4 (Pack Purchase)**: US1 + US2 (needs consumption working)
- **US5 (Dashboard)**: US1 + US2 (needs balance and transactions)
- **US6 (Cancellation)**: US1 + US2 (needs credits system working)

### Within Each User Story

- Tests written and FAIL before implementation
- Core logic before API routes
- API routes before UI components
- Story complete before moving to next priority
- Commit after each task or logical group

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- All tests for a user story marked [P] can run in parallel
- US3 and US4 can run in parallel after US1+US2 complete
- US5 and US6 can run in parallel after P2 stories complete

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: US1 - Monthly Allocation
4. Complete Phase 4: US2 - Consumption
5. **STOP and VALIDATE**: Test credit allocation and consumption end-to-end
6. Deploy/demo if ready - users can now use AI tools with credits

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 + US2 → Test independently → Deploy/Demo (MVP!)
3. Add US3 (Rollover) → Test independently → Deploy/Demo
4. Add US4 (Pack Purchase) → Test independently → Deploy/Demo
5. Add US5 (Dashboard) → Test independently → Deploy/Demo
6. Add US6 (Cancellation) → Test independently → Deploy/Demo
7. Complete Polish phase → Final release

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
