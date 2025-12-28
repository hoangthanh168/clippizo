# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Awareness

### Key Documents
- **Constitution**: `.specify/memory/constitution.md` — Core principles (Fast, Cheap, Opinionated, Modern, Safe)
- **Documentation**: `docs/` — Package guides, setup instructions, migration paths

### Before Starting Work
1. Read the constitution to understand project principles
2. Check `docs/packages/` for existing functionality before adding new code
3. Run `npm run boundaries` to verify workspace constraints

## Code Structure

### File Organization
- **apps/** — Deployable Next.js applications (app, web, api, docs, email, storybook, studio)
- **packages/** — Shared code (design-system, database, auth, payments, analytics, etc.)

Apps MUST NOT depend on other apps. Packages export interfaces consumed by apps.

### Module Patterns
- **Server/Client splits**: Packages with runtime-specific code have `server.ts` and `client.ts` exports
- **Environment validation**: Each package has `keys.ts` using Zod for env var validation
- **Provider pattern**: UI packages export Provider components (AnalyticsProvider, DesignSystemProvider)
- **Barrel exports**: Use `// biome-ignore lint/performance/noBarrelFile` when re-exporting

### File Size Guidelines
- Keep files focused and single-purpose
- Split large components into smaller composable pieces
- Route handlers should be thin — delegate to services/utilities
- Maximum ~300 lines per file; refactor if larger

## Testing Requirements

### Test Location
- Place tests in `__tests__/` directory within each app/package
- Name test files as `*.test.ts` or `*.test.tsx`

### Test Pattern
```typescript
import { expect, test } from "vitest";

test("descriptive test name", async () => {
  // Arrange
  // Act
  // Assert
  expect(result).toBe(expected);
});
```

### Running Tests
```bash
npm run test                              # All tests
npx vitest run path/to/test.test.ts       # Single file
npx vitest run --filter "test name"       # By name
npx vitest --watch                        # Watch mode
```

### Coverage Expectations
- Test API route handlers (request/response)
- Test utility functions with edge cases
- Test React components with user interactions
- Skip testing: third-party library wrappers, simple re-exports

## Style Conventions

### TypeScript
- Strict mode enabled (`strict: true`, `strictNullChecks: true`)
- No `any` types — use `unknown` with type guards
- Use `readonly` for React props: `readonly children: ReactNode`
- Prefer type aliases over interfaces for props

### Formatting
- Biome via Ultracite for linting/formatting
- Run `npm run check` before committing
- Run `npm run fix` to auto-fix issues
- Use `// biome-ignore` with explanation when disabling rules

### Naming
- **Files**: kebab-case (`user-profile.tsx`)
- **Components**: PascalCase (`UserProfile`)
- **Functions/variables**: camelCase (`getUserProfile`)
- **Constants**: SCREAMING_SNAKE_CASE (`API_BASE_URL`)
- **Types**: PascalCase with descriptive suffixes (`UserProfileProps`)

### Commits
Conventional commits format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`
- Breaking changes: Include `BREAKING CHANGE:` in footer

## Documentation Standards

### Code Comments
- Prefer self-documenting code over comments
- Use comments for "why", not "what"
- Use `// biome-ignore` with reason when disabling lint rules
- No JSDoc unless generating API documentation

### Inline Documentation
```typescript
// Good: explains why
// Skip validation for internal API calls (already validated upstream)
const data = await fetchInternal(url);

// Bad: explains what (obvious from code)
// Fetch data from URL
const data = await fetch(url);
```

### README Files
- Each package should have a README if it has non-obvious setup
- Document environment variables in `keys.ts` with Zod descriptions
- No duplicate documentation — link to canonical source

## Development Commands

```bash
npm run dev          # Start all apps (Turborepo)
npm run build        # Build all packages and apps
npm run test         # Run Vitest tests
npm run check        # Lint with Ultracite/Biome
npm run fix          # Auto-fix linting issues
npm run migrate      # Prisma: format, generate, db push
npm run boundaries   # Check workspace violations
```

### Single App Development
```bash
npm run dev --filter app       # Main app (port 3000)
npm run dev --filter web       # Marketing site (port 3001)
npm run dev --filter api       # API server (port 3002)
npm run dev --filter storybook # Component library (port 6006)
```

## Environment Variables

### Two-Tier System
This codebase uses a two-tier environment variable system:

| Location | Purpose | Used By |
|----------|---------|---------|
| `packages/*/.env` | CLI tools (Prisma, etc.) | `prisma migrate`, `prisma generate` |
| `apps/*/.env.local` | Runtime values | Next.js apps at runtime |

### How It Works
1. **Package `keys.ts`** uses `@t3-oss/env-nextjs` to validate env vars from `process.env`
2. **At runtime**, Next.js loads `apps/app/.env.local` into `process.env`
3. **Package code** (like `packages/database/index.ts`) reads from `process.env` at runtime
4. **Result**: App's `.env.local` provides values to packages at runtime

### Debugging Env Issues
When encountering env-related errors, check BOTH locations:
```bash
# Package-level (for CLI tools)
cat packages/database/.env

# App-level (for runtime)
cat apps/app/.env.local
```

**Common pitfall**: Env var exists in package `.env` but is missing/wrong in app `.env.local`

### Database Connection Strings (Supabase)
```bash
# DATABASE_URL - Pooler connection (for queries via pgbouncer)
# Format: postgres.[project-ref]@pooler.supabase.com:6543
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# DIRECT_URL - Direct connection (for migrations, schema changes)
# Format: postgres@db.[project-ref].supabase.co:5432
DIRECT_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
```

**Critical**: `DIRECT_URL` must use direct format (`db.[ref].supabase.co:5432`), NOT pooler format.

### Required Env Files
When setting up database:
1. Copy values to `packages/database/.env` (for Prisma CLI)
2. Copy SAME values to `apps/app/.env.local` (for runtime)
3. Update other apps if they use database: `apps/api/.env.local`, `apps/web/.env.local`

## Error Handling

**Crash immediately for:**
- Database connection failures (Prisma/Supabase)
- Authentication errors (Clerk middleware)
- Missing required environment variables (Zod validation in `keys.ts`)
- Invalid webhook signatures (Stripe, Clerk via Svix)

**Log and continue for:**
- Analytics events (PostHog, GA)
- CMS content fetching (BaseHub)
- Email sending (Resend)
- Non-critical background tasks

```typescript
import { captureException } from '@sentry/nextjs';
import { log } from '@repo/observability';
```
