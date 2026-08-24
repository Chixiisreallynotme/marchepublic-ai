import type { MemoryData } from "@/app/tenders/[id]/memory/components/types";
import type { TenderWithCounts } from "@/lib/actions/tenders";
import type { Organization } from "@prisma/client";

export const mockMemory: MemoryData = {
  id: "memory-1",
  title: "Mémoire technique - Construction école",
  status: "DRAFT",
  updatedAt: new Date("2026-01-01"),
  tender: {
    id: "tender-1",
    title: "Construction école maternelle",
    reference: "AO-2024-001",
    criteria: [
      { id: "crit-1", title: "Prix", weight: 40, order: 1 },
      { id: "crit-2", title: "Technique", weight: 60, order: 2 },
    ],
  },
  sections: [
    {
      id: "sec-1",
      title: "Offre économique",
      content: "Notre offre détaillée",
      wordCount: 4,
      criterionId: "crit-1",
      order: 0,
    },
  ],
};

const ORG: Organization = {
  id: "org-1",
  name: "Ville de Montpellier",
  role: "BUYER",
  email: null,
  phone: null,
  address: null,
  city: null,
  postalCode: null,
  sireneCompanyId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function tenderFixture(id: string, title: string, reference: string): TenderWithCounts {
  return {
    id,
    title,
    reference,
    description: "Description du marché",
    status: "PUBLISHED",
    procedureType: "APPEL_OFFRES_OUVERT",
    cpvCode: "45212345-6",
    buyerName: "Ville de Montpellier",
    estimatedValue: 850000,
    dceUrl: null,
    publicationDate: new Date("2026-01-15"),
    deadline: new Date("2026-03-15"),
    createdAt: new Date("2026-01-10"),
    updatedAt: new Date("2026-01-20"),
    organizationId: ORG.id,
    organization: ORG,
    _count: { criteria: 5 },
  };
}

export const mockTenderList: TenderWithCounts[] = [
  tenderFixture("tender-1", "Construction école maternelle", "AO-2024-001"),
  tenderFixture("tender-2", "Rénovation urbaine", "AO-2024-002"),
];
