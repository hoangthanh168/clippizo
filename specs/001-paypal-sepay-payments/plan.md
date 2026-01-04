# Implementation Plan: PayPal & SePay One-Time Subscription Payments

**Branch**:  | **Date**: 2026-01-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from 
## Summary

Replace Stripe with PayPal and SePay for one-time subscription payments. Users purchase subscriptions via one-time payments (not recurring billing) and manually renew when expired. SePay targets Vietnam market (VND, bank transfer, domestic cards), PayPal targets international users (USD).

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+ LTS
**Primary Dependencies**: Next.js (App Router), PayPal TypeScript SDK, SePay SDK/API, Prisma ORM
**Storage**: PostgreSQL 15+ via Supabase (existing database)
**Testing**: Vitest for unit/integration tests
**Target Platform**: Web (Next.js on Vercel)
**Project Type**: Monorepo web application (apps/ + packages/)
**Performance Goals**:
- Webhook processing < 30 seconds (SC-003)
- Page load < 2 seconds (SC-006)
- 99% webhook success rate (SC-002)
**Constraints**:
- VND currency for SePay, USD for PayPal
- No recurring billing (one-time payments only)
- Must handle idempotent webhook processing
**Scale/Scope**:
- 3 subscription tiers (Free, Pro, Enterprise)
- 2 payment providers (SePay, PayPal)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Fast | PASS | No impact on build times; SDK integration is standard |
| II. Cheap | PASS | Both PayPal and SePay have free tiers, no monthly fees |
| III. Opinionated | VIOLATION | Replacing Stripe (default) with PayPal/SePay - justified below |
| IV. Modern | PASS | Using latest PayPal TypeScript SDK and SePay API |
| V. Safe | PASS | Signature verification, Zod validation, Prisma ORM |

## Project Structure

### Documentation (this feature)

\
### Source Code (repository root)

\
**Structure Decision**: Monorepo structure following existing patterns. payments package modified to support multiple providers. Separate webhook routes for each provider.

## Complexity Tracking

> **Violations justified below**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Replace Stripe with PayPal/SePay | Stripe not available in Vietnam (user's country) | Continuing with Stripe is not possible for user's business |
| Two payment providers | Target both VN (SePay) and international (PayPal) markets | Single provider cannot serve both markets effectively |
