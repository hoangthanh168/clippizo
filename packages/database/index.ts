import "server-only";

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Use DIRECT_URL for database connection (bypasses connection pooler)
const connectionString =
  process.env.DIRECT_URL ||
  "postgresql://postgres:eHBInh1K2tBAEZfZ@db.mnvraegclumofybqxbhp.supabase.co:5432/postgres";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const database = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = database;
}

// biome-ignore lint/performance/noBarrelFile: re-exporting
export * from "./generated/client";
