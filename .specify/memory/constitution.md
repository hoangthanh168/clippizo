<!--
  SYNC IMPACT REPORT
  ==================
  Version change: 0.0.0 → 1.0.0 (Initial constitution)

  Modified principles: N/A (initial creation)

  Added sections:
  - Core Principles (5 principles: Fast, Cheap, Opinionated, Modern, Safe)
  - Technology Stack & Constraints
  - Development Workflow
  - Governance

  Removed sections: N/A (initial creation)

  Templates requiring updates:
  - .specify/templates/plan-template.md: ✅ Compatible (Constitution Check section aligns)
  - .specify/templates/spec-template.md: ✅ Compatible (Requirements structure aligns)
  - .specify/templates/tasks-template.md: ✅ Compatible (Phase structure supports principles)
  - .specify/templates/checklist-template.md: ✅ Compatible
  - .specify/templates/agent-file-template.md: ✅ Compatible

  Deferred items: None
-->

# Clippizo Constitution

## Core Principles

### I. Fast

Development velocity is paramount. Every architectural decision, tool selection, and process MUST optimize for rapid iteration cycles.

**Non-negotiable rules:**
- Build times MUST complete in under 60 seconds for incremental changes
- Hot module replacement MUST be enabled for all frontend development
- Database migrations MUST be non-blocking and reversible
- CI/CD pipelines MUST provide feedback within 10 minutes
- Development environment setup MUST complete in under 15 minutes for new contributors

**Rationale:** Speed enables experimentation. Slow feedback loops compound into wasted engineering time and deferred improvements.

### II. Cheap

Start free, scale economically. Infrastructure choices MUST prioritize services with generous free tiers that scale proportionally with usage.

**Non-negotiable rules:**
- All external services MUST have a free tier sufficient for development and MVP launch
- Cost per user MUST be quantifiable before production deployment
- Self-hosted alternatives MUST be documented for each paid service
- No vendor lock-in: data export paths MUST exist for all critical services
- Infrastructure costs MUST be reviewed monthly with documented thresholds for alerts

**Rationale:** Capital efficiency extends runway. Avoiding premature scaling costs preserves resources for product development.

### III. Opinionated

Integrated tooling over choice paralysis. The stack is deliberately constrained to tools designed to work together.

**Non-negotiable rules:**
- Technology substitutions MUST be justified with documented migration paths
- Default configurations MUST be used unless performance data justifies deviation
- Package additions MUST not duplicate existing functionality
- Breaking from conventions requires explicit approval and documentation
- Third-party integrations MUST use official SDKs when available

**Rationale:** Decision fatigue reduces productivity. Curated defaults free engineers to focus on product problems.

### IV. Modern

Latest stable features with healthy community support. Technology choices MUST balance innovation with reliability.

**Non-negotiable rules:**
- Node.js version MUST be LTS or current stable (20+)
- React and Next.js MUST track latest stable releases within 30 days
- Dependencies MUST be updated monthly; security patches within 48 hours
- Deprecated APIs MUST be migrated before end-of-life dates
- TypeScript strict mode MUST be enabled across all packages

**Rationale:** Modern tooling provides better DX, performance, and security. Technical debt from outdated dependencies compounds exponentially.

### V. Safe

End-to-end type safety and robust security posture. Security is a feature, not an afterthought.

**Non-negotiable rules:**
- All API inputs MUST be validated at runtime (Zod schemas required)
- Authentication MUST use established providers (Clerk); no custom auth implementations
- Secrets MUST never be committed; environment variables required
- SQL injection MUST be prevented through parameterized queries (Prisma ORM)
- XSS protection MUST be active; React's built-in escaping plus CSP headers
- Rate limiting MUST be implemented on all public endpoints (Arcjet)
- Error messages MUST NOT leak internal implementation details
- HTTPS MUST be enforced in all environments

**Rationale:** Security breaches destroy user trust irreparably. Type safety catches bugs before production.

## Technology Stack & Constraints

### Core Stack

| Layer | Technology | Version | Notes |
|-------|------------|---------|-------|
| Runtime | Node.js | 20+ LTS | Required for all packages |
| Framework | Next.js | Latest stable | App Router, Server Components |
| Language | TypeScript | 5.x | Strict mode enabled |
| Styling | Tailwind CSS | 4.x | Design system integration |
| Database | PostgreSQL | 15+ | Via Prisma ORM |
| Auth | Clerk | Latest | No custom auth |
| Payments | Stripe | Latest SDK | Subscription management |
| Email | Resend | Latest | Transactional emails |
| Analytics | PostHog + GA | Latest | Product + web analytics |
| Observability | Sentry | Latest | Error tracking, performance |
| CMS | BaseHub | Latest | Type-safe content |

### Monorepo Structure

```
clippizo/
├── apps/           # Deployable applications
│   ├── web/        # Marketing website (port 3001)
│   ├── app/        # Main application (port 3000)
│   ├── api/        # RESTful API
│   ├── docs/       # Documentation (Mintlify)
│   ├── email/      # Email templates (React Email)
│   └── storybook/  # Component development
└── packages/       # Shared packages
    ├── design-system/
    ├── database/
    ├── auth/
    ├── payments/
    ├── analytics/
    ├── observability/
    ├── security/
    ├── cms/
    └── [other shared packages]
```

### Constraints

- **Package Manager**: npm (10.8.1+) with workspaces
- **Build System**: Turborepo for monorepo orchestration
- **Linting**: Biome for formatting and linting
- **Testing**: Vitest for unit/integration tests
- **Deployment**: Vercel (apps), configurable for other platforms

## Development Workflow

### Code Review Requirements

- All changes MUST be submitted via pull request
- PRs MUST pass all CI checks before merge
- PRs MUST have at least one approval from a code owner
- PRs affecting security-critical code MUST have security review
- Force pushes to main/master are PROHIBITED

### Testing Gates

| Gate | Requirement | Blocking |
|------|-------------|----------|
| Type Check | `tsc --noEmit` passes | Yes |
| Lint | `biome check` passes | Yes |
| Unit Tests | All tests pass | Yes |
| Build | `turbo build` succeeds | Yes |
| E2E Tests | Critical paths pass | For releases |

### Deployment Process

1. Feature branches merge to `main` via approved PR
2. CI runs full test suite on merge
3. Preview deployments auto-generate for PRs
4. Production deployment requires:
   - All tests passing
   - No critical Sentry issues in staging
   - Changelog updated for user-facing changes

### Commit Standards

- Conventional commits format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`
- Breaking changes MUST include `BREAKING CHANGE:` in footer
- Co-authored commits MUST credit all contributors

## Governance

This constitution supersedes all other development practices. Amendments follow this process:

### Amendment Procedure

1. **Proposal**: Open an issue describing the proposed change and rationale
2. **Discussion**: Minimum 48-hour review period for feedback
3. **Approval**: Requires explicit approval from project maintainers
4. **Migration**: Document migration path for breaking changes
5. **Update**: Increment version, update `LAST_AMENDED_DATE`

### Versioning Policy

- **MAJOR**: Backward-incompatible principle changes or removals
- **MINOR**: New principles/sections or material expansions
- **PATCH**: Clarifications, wording improvements, typo fixes

### Compliance Review

- All PRs SHOULD be verified against constitution principles
- Complexity violations MUST be justified in PR description
- Security principle violations MUST trigger security review
- Constitution compliance checked during onboarding

**Version**: 1.0.0 | **Ratified**: 2025-12-27 | **Last Amended**: 2025-12-27
