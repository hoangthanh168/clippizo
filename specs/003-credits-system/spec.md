# Feature Specification: Credits System

**Feature Branch**: `003-credits-system`
**Created**: 2026-01-08
**Status**: Draft
**Input**: User description: "Implement credits system with monthly subscription credits, rollover mechanism, and credit packs (top-up)"

## Clarifications

### Session 2026-01-08

- Q: When user has both monthly and pack credits, which is consumed first? → A: Credit packs consumed first (protect paid top-ups from expiring)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Monthly Credits Allocation (Priority: P1)

As a subscriber, I receive a fixed amount of credits at the beginning of each billing cycle that I can use for AI video creation tools. This is the core foundation of the credits system.

**Why this priority**: This is the foundational feature - without monthly credit allocation, no other credit functionality can work. Users expect credits immediately upon subscribing.

**Independent Test**: Can be fully tested by subscribing to a plan and verifying credits are allocated. Delivers immediate value by enabling users to use AI tools.

**Acceptance Scenarios**:

1. **Given** a user subscribes to a plan, **When** the subscription is activated, **Then** they receive the designated monthly credits for that plan immediately.
2. **Given** a user has an active subscription, **When** a new billing cycle begins (monthly renewal), **Then** they receive a fresh allocation of monthly credits.
3. **Given** a user has 100 credits remaining from 500 monthly allocation, **When** the new billing cycle starts, **Then** unused credits are carried over (up to rollover limit) and new monthly credits are added.

---

### User Story 2 - Credits Consumption (Priority: P1)

As a subscriber, when I use AI tools (image generation, video generation), credits are deducted from my balance based on the tool and model used.

**Why this priority**: Equally critical as allocation - credits must be consumable to have any value. Different tools/models have different credit costs.

**Independent Test**: Can be tested by using any AI tool and verifying the correct amount is deducted from the credits balance.

**Acceptance Scenarios**:

1. **Given** a user has 500 credits, **When** they generate an AI image costing 10 credits, **Then** their balance becomes 490 credits.
2. **Given** a user has 50 credits, **When** they try to use a tool costing 100 credits, **Then** they see an insufficient credits message and the action is blocked.
3. **Given** a user has credits from multiple sources (monthly + pack), **When** they use credits, **Then** the system deducts credit pack credits first (to protect paid top-ups), then monthly credits; within each type, oldest expiring first.

---

### User Story 3 - Credits Rollover (Priority: P2)

As a subscriber, my unused credits roll over to the next billing cycle, but only up to a maximum limit (e.g., 2 months worth of credits).

**Why this priority**: Important for user retention and satisfaction - users should not lose all unused credits, but the system needs bounds to prevent unlimited accumulation.

**Independent Test**: Can be tested by letting a billing cycle pass with unused credits and verifying the rollover amount respects the cap.

**Acceptance Scenarios**:

1. **Given** a user with a plan granting 500 credits/month and rollover cap of 1000 (2 months), **When** they have 400 unused credits at cycle end, **Then** those 400 credits roll over and they have 900 total (400 + 500 new).
2. **Given** a user with 800 rolled-over credits and 500 monthly credits (1300 total, cap 1000), **When** the new cycle begins, **Then** excess credits (300) expire and balance is capped at 1000.
3. **Given** a user has credits exactly at the rollover cap, **When** the new cycle begins, **Then** the new monthly allocation causes the oldest credits to expire to stay within cap.

---

### User Story 4 - Credit Pack Purchase (Priority: P2)

As a subscriber with an active subscription, I can purchase additional credit packs (top-up) that add credits to my balance with their own expiration period.

**Why this priority**: Important revenue stream and user flexibility, but depends on the core credits system being in place first.

**Independent Test**: Can be tested by purchasing a credit pack and verifying credits are added with correct expiration date.

**Acceptance Scenarios**:

1. **Given** a user has an active subscription, **When** they purchase a 1000-credit pack, **Then** 1000 credits are added to their balance with a 90-day expiration.
2. **Given** a user without an active subscription, **When** they try to purchase a credit pack, **Then** they are prompted to subscribe first.
3. **Given** a user purchases multiple credit packs, **When** viewing their balance, **Then** they can see the breakdown of credits by source and expiration date.

---

### User Story 5 - Credits Dashboard (Priority: P3)

As a subscriber, I can view my current credits balance, usage history, credit sources, and expiration dates in a dashboard.

**Why this priority**: Important for transparency and user experience, but the core functionality works without it.

**Independent Test**: Can be tested by navigating to the dashboard and verifying accurate display of credit information.

**Acceptance Scenarios**:

1. **Given** a user is logged in, **When** they view the credits dashboard, **Then** they see total available credits, breakdown by source, and upcoming expirations.
2. **Given** a user has used credits, **When** they view usage history, **Then** they see a log of credit consumption with timestamps, amounts, and what it was used for.
3. **Given** a user has credits expiring soon, **When** they view the dashboard, **Then** they see a warning about credits expiring within the next 7 days.

---

### User Story 6 - Subscription Cancellation Credits Handling (Priority: P3)

As a subscriber who cancels, my credits remain available until the end of the current billing period, after which they are forfeited.

**Why this priority**: Edge case handling - important but lower frequency scenario.

**Independent Test**: Can be tested by cancelling a subscription and verifying credit behavior through end of billing period.

**Acceptance Scenarios**:

1. **Given** a user cancels their subscription mid-cycle, **When** they use AI tools before the period ends, **Then** they can still use their remaining credits.
2. **Given** a user subscription has ended after cancellation, **When** they try to use AI tools, **Then** they are blocked and prompted to resubscribe.
3. **Given** a user cancels and has purchased credit packs, **When** the subscription ends, **Then** all credits (monthly and pack) become unavailable until they resubscribe.

---

### Edge Cases

- What happens when a user downgrades their subscription plan mid-cycle? Credits remain until cycle ends, new allocation at renewal matches new plan.
- What happens when a user upgrades their subscription plan mid-cycle? Prorated credits are added immediately based on the difference.
- How does the system handle concurrent credit consumption (race conditions)? Atomic deduction ensures credits cannot be double-spent.
- What happens when credit pack expires while user has monthly credits? Pack credits are removed, monthly credits remain unaffected.
- What happens during payment failure on renewal? Grace period (3 days) where credits are frozen, then forfeited if payment not resolved.

## Requirements *(mandatory)*

### Functional Requirements

#### Core Credits Management

- **FR-001**: System MUST allocate the designated monthly credits to a user account immediately upon subscription activation.
- **FR-002**: System MUST allocate new monthly credits at the start of each billing cycle renewal.
- **FR-003**: System MUST track credits balance per user with breakdown by source (monthly vs. pack).
- **FR-004**: System MUST enforce a rollover cap equal to N months worth of credits (configurable per plan, default 2 months).
- **FR-005**: System MUST automatically expire credits that exceed the rollover cap at cycle renewal.

#### Credits Consumption

- **FR-006**: System MUST deduct credits atomically when a user consumes AI tools to prevent double-spending.
- **FR-007**: System MUST block usage attempts when user has insufficient credits and display appropriate message.
- **FR-008**: System MUST consume credit pack credits before monthly credits to protect purchased top-ups from expiring; within each source type, consume in FIFO order by expiration date.
- **FR-009**: System MUST support different credit costs per tool/model (e.g., basic image generation: 10 credits, premium video generation: 100 credits).
- **FR-010**: System MUST log all credit transactions (allocation, consumption, expiration) with timestamps.

#### Credit Packs

- **FR-011**: System MUST allow credit pack purchases only for users with active subscriptions.
- **FR-012**: System MUST add credit pack credits to user balance immediately upon successful payment.
- **FR-013**: System MUST track credit pack expiration separately (e.g., 90 days from purchase date).
- **FR-014**: System MUST automatically expire credit pack credits when their validity period ends.
- **FR-015**: System MUST offer multiple credit pack tiers with different amounts and prices.

#### User Interface

- **FR-016**: System MUST display current credits balance in the main application header/navigation.
- **FR-017**: System MUST provide a credits dashboard showing balance breakdown, usage history, and expiration dates.
- **FR-018**: System MUST notify users when credits are running low (below 20% of monthly allocation).
- **FR-019**: System MUST notify users when credits are about to expire (within 7 days).

#### Subscription Lifecycle

- **FR-020**: System MUST allow credit usage until subscription period ends after cancellation.
- **FR-021**: System MUST forfeit all credits (monthly and pack) when subscription becomes inactive.
- **FR-022**: System MUST handle subscription plan changes (upgrade/downgrade) with appropriate credit adjustments.
- **FR-023**: System MUST provide a grace period of 3 days for payment failures before freezing credits.

### Key Entities

- **Credit Balance**: The user available credits, broken down by source (monthly allocation vs. credit packs) with associated expiration dates.
- **Credit Transaction**: A record of credit movement (allocation, consumption, expiration, adjustment) with timestamp, amount, type, source, and related activity.
- **Credit Pack**: A purchasable bundle of credits with fixed amount, price, and validity period (days from purchase).
- **Subscription Plan**: Extended to include monthly credit allocation amount and rollover cap configuration.
- **Credit Source**: Identifies where credits came from (monthly billing cycle or specific credit pack purchase) and tracks individual expiration.

## Assumptions

- Monthly billing cycles are handled by existing payment system (PayPal/SePay).
- User authentication is handled by existing Clerk integration.
- Credit costs per tool/model will be defined in a configuration that can be adjusted without code changes.
- Default rollover cap is 2x monthly allocation unless otherwise specified per plan.
- Default credit pack validity is 90 days.
- Grace period for payment failures is 3 days.
- Low credits warning threshold is 20% of monthly allocation.
- Expiration warning threshold is 7 days.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users receive their monthly credits within 1 minute of subscription activation or billing cycle renewal.
- **SC-002**: Credit deductions are processed within 2 seconds of tool usage initiation.
- **SC-003**: 100% of credit transactions are accurately logged and auditable.
- **SC-004**: Users can view their complete credits balance and history within 3 seconds of opening the dashboard.
- **SC-005**: Credit pack purchases complete within 30 seconds of payment confirmation.
- **SC-006**: System correctly enforces rollover caps with 100% accuracy at billing cycle boundaries.
- **SC-007**: Zero instances of credits being double-spent due to race conditions.
- **SC-008**: 95% of users understand their credits status without needing support assistance.
