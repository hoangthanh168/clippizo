# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## About Clippizo

**Clippizo** is a SaaS platform providing AI-powered tools for video creation. The platform includes:

- **AI Image Generation** - Create images using AI for video content
- **AI Video Generation** - Generate video clips and sequences with AI
- **Content Management** - Organize and manage created assets
- **AI Chatbot** - Assist creators with workflow and content suggestions

Built for **content creators and video producers** who want to leverage AI for efficient video production. Similar in concept to Higgsfield.ai.

## Key Principles

- **Constitution**: `.specify/memory/constitution.md` (Fast, Cheap, Opinionated, Modern, Safe)
- Apps MUST NOT depend on other apps
- Packages export interfaces consumed by apps

## Quick Reference

@.claude/docs/architecture.md
@.claude/docs/conventions.md
@.claude/docs/testing.md
@.claude/docs/database.md
@.claude/docs/environment.md
@.claude/docs/infrastructure.md

## Essential Commands

```bash
npm run dev          # Start all apps (Turborepo)
npm run build        # Build all packages and apps
npm run test         # Run Vitest tests
npm run check        # Lint with Ultracite/Biome
npm run fix          # Auto-fix linting issues
npm run migrate      # Prisma: format, generate, db push
npm run boundaries   # Check workspace constraints
```

### Single App Development

```bash
npm run dev --filter app       # Main app (port 3000)
npm run dev --filter web       # Marketing site (port 3001)
npm run dev --filter api       # API server (port 3002)
npm run dev --filter storybook # Component library (port 6006)
```

## Before Starting Work

1. Read the constitution to understand project principles
2. Check `docs/packages/` for existing functionality before adding new code
3. Run `npm run boundaries` to verify workspace constraints

## Error Handling

**Crash immediately for:**
- Database connection failures (Prisma/Supabase)
- Authentication errors (Clerk middleware)
- Missing required environment variables (Zod validation in `keys.ts`)
- Invalid webhook signatures (PayPal, SePay, Clerk via Svix)

**Log and continue for:**
- Analytics events (PostHog, GA)
- CMS content fetching (BaseHub)
- Email sending (Resend)
- Non-critical background tasks

```typescript
import { captureException } from '@sentry/nextjs';
import { log } from '@repo/observability';
```

## Active Technologies
- TypeScript 5.x, Node.js 20+ LTS + Next.js (App Router), Prisma ORM, PayPal SDK, Zod (003-credits-system)
- PostgreSQL 15+ via Supabase (existing) (003-credits-system)

## Recent Changes
- 003-credits-system: Added TypeScript 5.x, Node.js 20+ LTS + Next.js (App Router), Prisma ORM, PayPal SDK, Zod
