import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

export function createDatabase(connectionString: string) {
  const adapter = new PrismaPg({ connectionString });
  const client = new PrismaClient({ adapter });

  return {
    client,
    async checkConnection() {
      await client.$queryRaw`SELECT 1`;
    },
    async disconnect() {
      await client.$disconnect();
    },
  };
}

export type Database = ReturnType<typeof createDatabase>;
