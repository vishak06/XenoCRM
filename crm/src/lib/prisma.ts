import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

const globalForPrisma = globalThis as unknown as {
  prisma_new: PrismaClient | undefined;
};

const pool = new Pool({ 
  connectionString,
  max: 1 // Limit to 1 connection per instance to avoid EMAXCONNSESSION
});
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma_new ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma_new = prisma;
