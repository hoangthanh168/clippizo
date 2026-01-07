# Architecture

## About Clippizo

Clippizo is a SaaS platform providing AI-powered tools for video creation, including AI image generation, AI video generation, content management, and AI chatbot assistance.

## File Organization

```
apps/           # Deployable Next.js applications
├── app         # Main Clippizo dashboard - AI video creation tools (port 3000)
├── web         # Marketing site - showcases AI video capabilities (port 3001)
├── api         # Backend API - AI generation services and content management (port 3002)
├── docs        # Platform and API documentation
├── email       # Email templates for notifications and marketing
├── storybook   # Component library for Clippizo design system (port 6006)
└── studio      # Admin studio for platform management

packages/       # Shared code
├── ai          # AI service integrations (image gen, video gen, chatbot)
├── design-system # Clippizo UI components and design tokens
├── database    # Data models (users, content, AI generations, subscriptions)
├── auth        # Authentication via Clerk
├── payments    # PayPal + SePay subscription handling
├── analytics   # Usage tracking and AI generation analytics
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
