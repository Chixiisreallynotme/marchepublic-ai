// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.hoisted(() => {
  process.env.DATABASE_URL ??= "file:./dev.db";
});

vi.unmock("@prisma/client");

import { prisma } from "@/lib/prisma";

describe("Database Layer - Prisma Queries", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Organization queries", () => {
    it("should find the seeded organization by name", async () => {
      const org = await prisma.organization.findFirst({
        where: { name: "Novatech BTP SAS" },
      });

      expect(org).not.toBeNull();
      expect(org?.name).toBe("Novatech BTP SAS");
      expect(org?.role).toBe("BIDDER");
      expect(org?.email).toBe("contact@novatech-btp.fr");
      expect(org?.city).toBe("Lyon");
    });

    it("should find organization with SireneCompany relation", async () => {
      const org = await prisma.organization.findFirst({
        where: { name: "Novatech BTP SAS" },
        include: { sireneCompany: true },
      });

      expect(org?.sireneCompany).not.toBeNull();
      expect(org?.sireneCompany?.siren).toBe("834928192");
      expect(org?.sireneCompany?.denomination).toBe("NOVATECH BTP SAS");
    });
  });

  describe("Tender queries", () => {
    it("should find the seeded tender by reference", async () => {
      const tender = await prisma.tender.findUnique({
        where: { reference: "AO-2024-001245" },
      });

      expect(tender).not.toBeNull();
      expect(tender?.title).toContain("Rénovation énergétique");
      expect(tender?.title).toContain("Groupe Scolaire Jean Moulin");
      expect(tender?.cpvCode).toBe("45261210-9");
      expect(tender?.estimatedValue).toBe(850000);
      expect(tender?.buyerName).toBe("Ville de Lyon - Direction des Bâtiments Scolaires");
      expect(tender?.status).toBe("PUBLISHED");
      expect(tender?.procedureType).toBe("APPEL_OFFRES_OUVERT");
    });

    it("should find tender with organization relation", async () => {
      const tender = await prisma.tender.findUnique({
        where: { reference: "AO-2024-001245" },
        include: { organization: true },
      });

      expect(tender?.organization).not.toBeNull();
      expect(tender?.organization?.name).toBe("Novatech BTP SAS");
    });
  });

  describe("Criterion queries", () => {
    it("should find all 5 criteria for the tender", async () => {
      const criteria = await prisma.criterion.findMany({
        where: { tender: { reference: "AO-2024-001245" } },
        orderBy: { order: "asc" },
      });

      expect(criteria).toHaveLength(5);

      const titles = criteria.map((c) => c.title);
      expect(titles).toContain("Méthodologie d'exécution");
      expect(titles).toContain("Moyens humains et encadrement");
      expect(titles).toContain("Démarche environnementale et RSE");
      expect(titles).toContain("Planning et phasage en site occupé");
      expect(titles).toContain("Prix des prestations");
    });

    it("should have correct weights summing to 100%", async () => {
      const criteria = await prisma.criterion.findMany({
        where: { tender: { reference: "AO-2024-001245" } },
      });

      const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
      expect(totalWeight).toBe(100);

      const weights = criteria.map((c) => c.weight).sort((a, b) => b - a);
      expect(weights).toEqual([40, 20, 15, 15, 10]);
    });

    it("should find criteria with tender relation", async () => {
      const criteria = await prisma.criterion.findMany({
        where: { tender: { reference: "AO-2024-001245" } },
        include: { tender: true },
      });

      for (const criterion of criteria) {
        expect(criterion.tender.reference).toBe("AO-2024-001245");
      }
    });
  });

  describe("TechnicalMemory queries", () => {
    it("should find the seeded technical memory", async () => {
      const memory = await prisma.technicalMemory.findUnique({
        where: { id: "memory-novatech-renovation-lyon" },
      });

      expect(memory).not.toBeNull();
      expect(memory?.title).toBe("Mémoire Technique - Rénovation Groupe Scolaire Jean Moulin");
      expect(memory?.status).toBe("DRAFT");
      expect(memory?.summary).toContain("point par point aux 5 critères");
    });

    it("should find technical memory with tender and organization relations", async () => {
      const memory = await prisma.technicalMemory.findUnique({
        where: { id: "memory-novatech-renovation-lyon" },
        include: { tender: true, organization: true },
      });

      expect(memory?.tender.reference).toBe("AO-2024-001245");
      expect(memory?.organization.name).toBe("Novatech BTP SAS");
    });

    it("should find technical memory with 5 sections", async () => {
      const memory = await prisma.technicalMemory.findUnique({
        where: { id: "memory-novatech-renovation-lyon" },
        include: { sections: { orderBy: { order: "asc" } } },
      });

      expect(memory?.sections).toHaveLength(5);

      const sectionTitles = memory?.sections.map((s) => s.title) ?? [];
      expect(sectionTitles[0]).toContain("Méthodologie d'exécution");
      expect(sectionTitles[1]).toContain("Moyens humains");
      expect(sectionTitles[2]).toContain("Démarche environnementale");
      expect(sectionTitles[3]).toContain("Planning et phasage");
      expect(sectionTitles[4]).toContain("Prix des prestations");
    });

    it("should have sections linked to criteria", async () => {
      const memory = await prisma.technicalMemory.findUnique({
        where: { id: "memory-novatech-renovation-lyon" },
        include: { sections: { include: { criterion: true } } },
      });

      for (const section of memory?.sections ?? []) {
        expect(section.criterion).not.toBeNull();
        expect(section.criterionId).toBe(section.criterion?.id);
      }
    });
  });

  describe("MemorySection queries", () => {
    it("should find sections with detailed content", async () => {
      const sections = await prisma.memorySection.findMany({
        where: { memory: { id: "memory-novatech-renovation-lyon" } },
        orderBy: { order: "asc" },
      });

      expect(sections).toHaveLength(5);

      for (const section of sections) {
        expect(section.content.length).toBeGreaterThan(500);
        expect(section.title).toBeTruthy();
        expect(section.order).toBeGreaterThan(0);
      }
    });

    it("should have section 1 (Méthodologie) with site occupé details", async () => {
      const section = await prisma.memorySection.findFirst({
        where: {
          memory: { id: "memory-novatech-renovation-lyon" },
          title: { contains: "Méthodologie" },
        },
      });

      expect(section?.title).toContain("site occupé");
      expect(section?.content).toContain("PHASAGE");
      expect(section?.content).toContain("Cloisonnements étanches");
    });

    it("should have section 3 (Environnement) with bas carbone details", async () => {
      const section = await prisma.memorySection.findFirst({
        where: {
          memory: { id: "memory-novatech-renovation-lyon" },
          title: { contains: "environnementale" },
        },
      });

      expect(section?.content).toContain("BAS CARBONE");
      expect(section?.content).toContain("biosourcé");
      expect(section?.content).toContain("VALORISATION");
    });

    it("should have section 5 (Prix) with price breakdown", async () => {
      const section = await prisma.memorySection.findFirst({
        where: {
          memory: { id: "memory-novatech-renovation-lyon" },
          title: { contains: "Prix" },
        },
      });

      expect(section?.content).toContain("847 500 €");
      expect(section?.content).toContain("Lot 03");
      expect(section?.content).toContain("ITE");
    });
  });

  describe("CerfaDocument queries", () => {
    it("should find the DC1 document pre-filled", async () => {
      const cerfa = await prisma.cerfaDocument.findUnique({
        where: { id: "cerfa-dc1-novatech" },
      });

      expect(cerfa).not.toBeNull();
      expect(cerfa?.formNumber).toBe("DC1");
      expect(cerfa?.label).toContain("11197");
    });

    it("should have valid JSON payload with all required fields", async () => {
      const cerfa = await prisma.cerfaDocument.findUnique({
        where: { id: "cerfa-dc1-novatech" },
      });

      const payload = JSON.parse(cerfa?.payload ?? "{}");

      expect(payload.raisonSociale).toBe("Novatech BTP SAS");
      expect(payload.siren).toBe("834928192");
      expect(payload.representantLegal.nom).toBe("DUBOIS");
      expect(payload.capacitesProfessionnelles.qualifications).toContain(
        "Qualibat 4111 - Isolation thermique par l'extérieur"
      );
      expect(payload.assurances.rcDecennale.assureur).toBe("SMABTP");
      expect(payload.declarationsHonneur.nonCondamnation).toBe(true);
    });

    it("should be linked to the technical memory", async () => {
      const cerfa = await prisma.cerfaDocument.findUnique({
        where: { id: "cerfa-dc1-novatech" },
        include: { memory: true },
      });

      expect(cerfa?.memory.id).toBe("memory-novatech-renovation-lyon");
    });
  });

  describe("SireneCompany queries", () => {
    it("should find the seeded SireneCompany", async () => {
      const company = await prisma.sireneCompany.findUnique({
        where: { siren: "834928192" },
      });

      expect(company).not.toBeNull();
      expect(company?.denomination).toBe("NOVATECH BTP SAS");
      expect(company?.legalForm?.toLowerCase()).toContain("société par actions simplifiée");
      expect(company?.activityCode).toContain("4120A");
      expect(company?.city).toBe("LYON");
      expect(company?.postalCode).toBe("69002");
    });

    it("should be linked to organization", async () => {
      const company = await prisma.sireneCompany.findUnique({
        where: { siren: "834928192" },
        include: { organizations: true },
      });

      expect(company?.organizations).toHaveLength(1);
      expect(company?.organizations[0].name).toBe("Novatech BTP SAS");
    });
  });

  describe("Complex relational queries", () => {
    it("should query tender with all criteria and memory sections in one query", async () => {
      const tender = await prisma.tender.findUnique({
        where: { reference: "AO-2024-001245" },
        include: {
          criteria: { orderBy: { order: "asc" } },
          technicalMemories: {
            include: {
              sections: {
                orderBy: { order: "asc" },
                include: { criterion: true },
              },
            },
          },
        },
      });

      expect(tender).not.toBeNull();
      expect(tender?.criteria).toHaveLength(5);
      expect(tender?.technicalMemories).toHaveLength(1);

      const memory = tender?.technicalMemories[0];
      expect(memory?.sections).toHaveLength(5);

      for (let i = 0; i < 5; i++) {
        expect(memory?.sections[i].criterionId).toBe(tender?.criteria[i].id);
      }
    });

    it("should verify data integrity across all models", async () => {
      const orgCount = await prisma.organization.count();
      const tenderCount = await prisma.tender.count();
      const criteriaCount = await prisma.criterion.count();
      const memoryCount = await prisma.technicalMemory.count();
      const sectionCount = await prisma.memorySection.count();
      const cerfaCount = await prisma.cerfaDocument.count();
      const sireneCount = await prisma.sireneCompany.count();

      expect(orgCount).toBeGreaterThanOrEqual(1);
      expect(tenderCount).toBeGreaterThanOrEqual(1);
      expect(criteriaCount).toBe(5);
      expect(memoryCount).toBeGreaterThanOrEqual(1);
      expect(sectionCount).toBe(5);
      expect(cerfaCount).toBeGreaterThanOrEqual(1);
      expect(sireneCount).toBeGreaterThanOrEqual(1);
    });
  });
});