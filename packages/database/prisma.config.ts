import { defineConfig } from "prisma/config";
import { keys } from "./keys";
import "dotenv/config";

const envKeys = keys();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use direct URL for migrations (bypasses connection pooler)
    url: envKeys.DIRECT_URL,
  },
});
