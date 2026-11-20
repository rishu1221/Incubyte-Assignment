import { prisma } from "../../lib/prisma";

export const healthRepository = {
  async ping(): Promise<void> {
    await prisma.$queryRaw`SELECT 1`;
  },
};
