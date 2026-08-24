import { prisma } from "@/lib/prisma";
import { prismaErrorCode } from "@/lib/actions/shared";

export const DEFAULT_ORG_NAME = "Mon Entreprise";

export type ActiveOrganization = {
  id: string;
  name: string;
  sireneCompanyId: string | null;
};

// No module-level cache: SQLite local lookups are sub-millisecond and a
// cached organization would go stale after seed resets or deletions.
export async function getActiveOrganization(): Promise<ActiveOrganization> {
  const existing =
    (await prisma.organization.findFirst({
      where: { role: "BIDDER" },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, sireneCompanyId: true },
    })) ??
    (await prisma.organization.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, sireneCompanyId: true },
    }));

  if (existing) {
    return {
      id: existing.id,
      name: existing.name,
      sireneCompanyId: existing.sireneCompanyId,
    };
  }

  try {
    return await prisma.organization.create({
      data: { name: DEFAULT_ORG_NAME, role: "BIDDER" },
      select: { id: true, name: true, sireneCompanyId: true },
    });
  } catch (error) {
    // Two concurrent cold-start requests can both reach the create branch;
    // the loser re-reads the winner's row instead of failing.
    if (prismaErrorCode(error) === "P2002") {
      const winner = await prisma.organization.findFirst({
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, sireneCompanyId: true },
      });
      if (winner) return winner;
    }
    throw error;
  }
}
