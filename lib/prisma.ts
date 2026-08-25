import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

// SQLite hardening: WAL allows concurrent readers with the single writer and
// busy_timeout avoids immediate SQLITE_BUSY under short write contention.
// Fire-and-forget: engines without SQLite (tests, future Postgres) ignore it.
if (process.env.NODE_ENV !== "test") {
  void prisma
    .$queryRawUnsafe("PRAGMA journal_mode=WAL;")
    .catch(() => undefined);
  void prisma
    .$queryRawUnsafe("PRAGMA busy_timeout=5000;")
    .catch(() => undefined);
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
