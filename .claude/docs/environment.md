# Environment Variables

## Two-Tier System

This codebase uses a two-tier environment variable system:

| Location | Purpose | Used By |
|----------|---------|---------|
| `packages/*/.env` | CLI tools (Prisma, etc.) | `prisma migrate`, `prisma generate` |
| `apps/*/.env.local` | Runtime values | Next.js apps at runtime |

## How It Works

1. **Package `keys.ts`** uses `@t3-oss/env-nextjs` to validate env vars from `process.env`
2. **At runtime**, Next.js loads `apps/app/.env.local` into `process.env`
3. **Package code** (like `packages/database/index.ts`) reads from `process.env` at runtime
4. **Result**: App's `.env.local` provides values to packages at runtime

## Debugging Env Issues

When encountering env-related errors, check BOTH locations:

```bash
# Package-level (for CLI tools)
cat packages/database/.env

# App-level (for runtime)
cat apps/app/.env.local
```

**Common pitfall**: Env var exists in package `.env` but is missing/wrong in app `.env.local`

## Database Connection Strings (Supabase)

```bash
# DATABASE_URL - Pooler connection (for queries via pgbouncer)
# Format: postgres.[project-ref]@pooler.supabase.com:6543
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# DIRECT_URL - Direct connection (for migrations, schema changes)
# Format: postgres@db.[project-ref].supabase.co:5432
DIRECT_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
```

**Critical**: `DIRECT_URL` must use direct format (`db.[ref].supabase.co:5432`), NOT pooler format.

## Required Env Files

When setting up database:
1. Copy values to `packages/database/.env` (for Prisma CLI)
2. Copy SAME values to `apps/app/.env.local` (for runtime)
3. Update other apps if they use database: `apps/api/.env.local`, `apps/web/.env.local`

## Exception: apps/studio

`apps/studio` runs `prisma studio` command (CLI tool), NOT Next.js runtime. The `dotenv/config` in `prisma.config.ts` only reads `.env` files, not `.env.local`.

**Required files for studio:**
| File | Purpose |
|------|---------|
| `apps/studio/.env` | Prisma CLI (`dotenv/config`) - **REQUIRED** |
| `apps/studio/.env.local` | Next.js runtime (if applicable) |

```bash
# apps/studio/.env (copy from packages/database/.env)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

**Why this happens**: When `prisma studio` runs from `apps/studio` directory, `dotenv/config` looks for `.env` in the current working directory, not `.env.local`.
