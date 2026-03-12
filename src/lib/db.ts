// Add pgbouncer param for Supabase pooler to avoid "prepared statement already exists" errors
const url = process.env.DATABASE_URL;
if (url?.includes("pooler.supabase.com") && !url.includes("pgbouncer=true")) {
  process.env.DATABASE_URL =
    url + (url.includes("?") ? "&" : "?") + "pgbouncer=true";
}

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
