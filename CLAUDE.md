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

## Error Handling

**Crash immediately for:**
- Database connection failures (Prisma/Neon)
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
