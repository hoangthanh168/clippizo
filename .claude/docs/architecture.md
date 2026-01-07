# Architecture

## File Organization

```
apps/           # Deployable Next.js applications
├── app         # Main app (port 3000)
├── web         # Marketing site (port 3001)
├── api         # API server (port 3002)
├── docs        # Documentation
├── email       # Email templates
├── storybook   # Component library (port 6006)
└── studio      # Admin studio

packages/       # Shared code
├── design-system
├── database
├── auth
├── payments
├── analytics
└── ...
```

**Critical Rule**: Apps MUST NOT depend on other apps. Packages export interfaces consumed by apps.

## Module Patterns

### Server/Client Splits
Packages with runtime-specific code have separate exports:
- `server.ts` - Server-side code
- `client.ts` - Client-side code

### Environment Validation
Each package has `keys.ts` using Zod for env var validation:
```typescript
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
  },
  // ...
});
```

### Provider Pattern
UI packages export Provider components:
- `AnalyticsProvider`
- `DesignSystemProvider`

### Barrel Exports
When re-exporting, use:
```typescript
// biome-ignore lint/performance/noBarrelFile: required for package exports
export * from "./components";
```

## File Size Guidelines

- Keep files focused and single-purpose
- Split large components into smaller composable pieces
- Route handlers should be thin — delegate to services/utilities
- **Maximum ~300 lines per file**; refactor if larger
