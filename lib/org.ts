import { prisma } from "@/lib/prisma";

export const DEFAULT_ORG_NAME = "Mon Entreprise";

export type ActiveOrganization = {
  id: string;
  name: string;
  sireneCompanyId: string | null;
};

let cached: ActiveOrganization | undefined;

export async function getActiveOrganization(): Promise<ActiveOrganization> {
  if (cached !== undefined) return cached;

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
    cached = {
      id: existing.id,
      name: existing.name,
      sireneCompanyId: existing.sireneCompanyId,
    };
    return cached;
  }

  const created = await prisma.organization.create({
    data: { name: DEFAULT_ORG_NAME, role: "BIDDER" },
    select: { id: true, name: true, sireneCompanyId: true },
  });

  cached = created;
  return cached;
}

export function invalidateOrgCache() {
  cached = undefined;
}
