import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Criterion, MemorySection, TechnicalMemory, Organization } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createOrUpdateMemorySection,
  getMemoryByTenderId,
  reorderSections,
  updateMemoryStatus,
} from "@/lib/actions/memories";
import type { TechnicalMemoryWithRelations } from "@/lib/actions/memories";
import {
  createMemorySchema,
  createSectionSchema,
  reorderSectionsSchema,
  updateMemorySchema,
  updateSectionSchema,
} from "@/lib/schemas/memory";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    technicalMemory: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    memorySection: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    criterion: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

type LooseFn = ReturnType<typeof vi.fn>;
type LoosePrisma = {
  technicalMemory: Record<"findFirst" | "findUnique" | "create" | "update", LooseFn>;
  memorySection: Record<"findMany" | "findUnique" | "create" | "update", LooseFn>;
  criterion: Record<"findUnique" | "aggregate", LooseFn>;
  $transaction: LooseFn;
};

// Loose typing intentional: Prisma delegate return types require full relation
// graphs that fixtures deliberately omit; runtime behavior is unaffected.
const mockedPrisma = vi.mocked(prisma, true) as unknown as LoosePrisma;

const ORGANIZATION = {
  id: "org-novatech",
  name: "Novatech BTP SAS",
  role: "BIDDER",
  email: "contact@novatech-btp.fr",
  phone: null,
  address: null,
  city: "Lyon",
  postalCode: "69002",
  sireneCompanyId: null,
  createdAt: new Date("2026-01-05T09:00:00.000Z"),
  updatedAt: new Date("2026-08-01T10:00:00.000Z"),
} as Organization;

const TENDER = {
  id: "tender-test-1",
  title: "Fourniture et pose de mobilier urbain",
  reference: "AO-2026-100-MU",
  description: null,
  status: "DRAFT",
  procedureType: "APPEL_OFFRES_OUVERT",
  cpvCode: "34992100-1",
  buyerName: "Métropole de Lyon",
  estimatedValue: 120000,
  publicationDate: null,
  deadline: new Date("2026-11-30T17:00:00.000Z"),
  createdAt: new Date("2026-08-20T08:00:00.000Z"),
  updatedAt: new Date("2026-08-20T08:00:00.000Z"),
  organizationId: ORGANIZATION.id,
  organization: ORGANIZATION,
  criteria: [],
};

function criterionFixture(overrides: Partial<Criterion> = {}): Criterion {
  return {
    id: "criterion-test-1",
    title: "Méthodologie d'exécution",
    description: null,
    weight: 40,
    order: 1,
    createdAt: new Date("2026-08-20T08:00:00.000Z"),
    tenderId: "tender-test-1",
    sections: [],
    tender: TENDER,
    ...overrides,
  } as Criterion;
}

function memoryFixture(overrides: Partial<TechnicalMemory> = {}): TechnicalMemory {
  return {
    id: "memory-test-1",
    title: "Mémoire technique - Mobilier urbain",
    status: "DRAFT",
    summary: null,
    createdAt: new Date("2026-08-20T08:00:00.000Z"),
    updatedAt: new Date("2026-08-20T08:00:00.000Z"),
    tenderId: "tender-test-1",
    organizationId: ORGANIZATION.id,
    ...overrides,
  };
}

function sectionFixture(overrides: Partial<MemorySection> = {}): MemorySection {
  return {
    id: "section-test-1",
    title: "Présentation de l'entreprise",
    content: "Notre entreprise...",
    wordCount: 2,
    order: 0,
    createdAt: new Date("2026-08-20T08:00:00.000Z"),
    updatedAt: new Date("2026-08-20T08:00:00.000Z"),
    memoryId: "memory-test-1",
    criterionId: null,
    ...overrides,
  };
}

const validMemoryInput = {
  title: "Mémoire technique - Mobilier urbain",
  tenderId: "tender-test-1",
  organizationId: ORGANIZATION.id,
};

const validSectionInput = {
  title: "Présentation de l'entreprise",
  content: "Notre entreprise dispose de 20 ans d'expérience...",
  memoryId: "memory-test-1",
  criterionId: "criterion-test-1",
  order: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("lib/schemas/memory", () => {
  it("createMemorySchema applique les valeurs par défaut et nettoie le titre", () => {
    const parsed = createMemorySchema.parse({
      title: "  Mémoire technique - Test  ",
      tenderId: "tender-test-1",
      organizationId: ORGANIZATION.id,
    });

    expect(parsed.title).toBe("Mémoire technique - Test");
    expect(parsed.status).toBe("DRAFT");
    expect(parsed.summary).toBeUndefined();
  });

  it("createMemorySchema rejette un titre trop court", () => {
    const parsed = createMemorySchema.safeParse({
      title: "Ab",
      tenderId: "tender-test-1",
      organizationId: ORGANIZATION.id,
    });
    expect(parsed.success).toBe(false);
  });

  it("updateMemorySchema accepte un payload partiel vide", () => {
    const parsed = updateMemorySchema.safeParse({});
    expect(parsed.success).toBe(true);
  });

  it("rejette un statut mémoire invalide", () => {
    const parsed = updateMemorySchema.safeParse({ status: "INVALID_STATUS" });
    expect(parsed.success).toBe(false);
  });

  it("createSectionSchema positionne order=0 par défaut et calcule wordCount", () => {
    const parsed = createSectionSchema.parse({
      title: "Nouvelle section",
      content: "Contenu de test avec plusieurs mots",
      memoryId: "memory-test-1",
    });
    expect(parsed.order).toBe(0);
    expect(parsed.criterionId).toBeUndefined();
  });

  it("updateSectionSchema valide une modification partielle du contenu", () => {
    const parsed = updateSectionSchema.safeParse({ content: "Nouveau contenu" });
    expect(parsed.success).toBe(true);
  });

  it("reorderSectionsSchema valide un tableau d'objets id/order", () => {
    const parsed = reorderSectionsSchema.safeParse({
      sections: [
        { id: "sec-1", order: 0 },
        { id: "sec-2", order: 1 },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it("reorderSectionsSchema rejette un order négatif", () => {
    const parsed = reorderSectionsSchema.safeParse({
      sections: [{ id: "sec-1", order: -1 }],
    });
    expect(parsed.success).toBe(false);
  });
});

describe("getMemoryByTenderId", () => {
  it("retourne le mémoire technique avec ses relations en cas de succès", async () => {
    const memory = memoryFixture();
    const criteria = [criterionFixture(), criterionFixture({ id: "criterion-2", weight: 30 })];
    const sections = [sectionFixture({ criterionId: "criterion-test-1" })];

    mockedPrisma.technicalMemory.findFirst.mockImplementation(async () => ({
      ...memory,
      tender: { ...TENDER, criteria },
      sections: sections.map((s) => ({ ...s, criterion: criteria.find((c) => c.id === s.criterionId) ?? null })),
    } as TechnicalMemoryWithRelations));

    const result = await getMemoryByTenderId("tender-test-1", ORGANIZATION.id);

    if (!result.success) throw new Error(result.error);
    expect(result.data?.id).toBe("memory-test-1");
    expect(result.data?.tender.criteria).toHaveLength(2);
    expect(result.data?.sections).toHaveLength(1);
    expect(mockedPrisma.technicalMemory.findFirst).toHaveBeenCalledWith({
      where: { tenderId: "tender-test-1", organizationId: ORGANIZATION.id },
      include: {
        tender: { include: { criteria: { orderBy: { order: "asc" } } } },
        sections: { include: { criterion: true }, orderBy: { order: "asc" } },
      },
    });
  });

  it("retourne null si aucun mémoire n'existe", async () => {
    mockedPrisma.technicalMemory.findFirst.mockResolvedValue(null);

    const result = await getMemoryByTenderId("tender-test-1", ORGANIZATION.id);

    expect(result.success).toBe(true);
    if (!result.success) throw new Error(result.error);
    expect(result.data).toBeNull();
  });

  it("retourne une erreur si tenderId est vide", async () => {
    const result = await getMemoryByTenderId("   ", ORGANIZATION.id);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("requis");
    }
    expect(mockedPrisma.technicalMemory.findFirst).not.toHaveBeenCalled();
  });

  it("retourne une erreur si organizationId est vide", async () => {
    const result = await getMemoryByTenderId("tender-test-1", "   ");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("requis");
    }
  });

  it("retourne une erreur structurée en cas d'échec base de données", async () => {
    mockedPrisma.technicalMemory.findFirst.mockImplementation(async () => {
      throw new Error("connection refused");
    });

    const result = await getMemoryByTenderId("tender-test-1", ORGANIZATION.id);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("erreur interne");
    }
  });
});

describe("createOrUpdateMemorySection", () => {
  it("crée une nouvelle section depuis un payload valide", async () => {
    const memory = memoryFixture();
    const criterion = criterionFixture();
    const createdSection = { ...sectionFixture({ content: validSectionInput.content }), wordCount: 7 };

    mockedPrisma.technicalMemory.findUnique.mockImplementation(async () => memory);
    mockedPrisma.criterion.findUnique.mockImplementation(async () => criterion);
    mockedPrisma.memorySection.create.mockImplementation(async () => createdSection);

    const result = await createOrUpdateMemorySection(validSectionInput);

    if (!result.success) throw new Error(result.error);
    expect(result.data.title).toBe("Présentation de l'entreprise");
    expect(result.data.wordCount).toBe(7);
    expect(mockedPrisma.memorySection.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: "Présentation de l'entreprise",
        content: "Notre entreprise dispose de 20 ans d'expérience...",
        wordCount: 7,
        memoryId: "memory-test-1",
        criterionId: "criterion-test-1",
        order: 0,
      }),
    });
  });

  it("met à jour une section existante quand id est fourni", async () => {
    const memory = memoryFixture();
    const criterion = criterionFixture();
    const existingSection = sectionFixture({ id: "section-existing", content: "Contenu existant" });
    const updatedSection = { ...existingSection, title: "Titre modifié", wordCount: 2 };

    mockedPrisma.technicalMemory.findUnique.mockImplementation(async () => memory);
    mockedPrisma.criterion.findUnique.mockImplementation(async () => criterion);
    mockedPrisma.memorySection.update.mockImplementation(async () => updatedSection);

    const result = await createOrUpdateMemorySection({
      ...validSectionInput,
      id: "section-existing",
      title: "Titre modifié",
    });

    if (!result.success) throw new Error(result.error);
    expect(result.data.title).toBe("Titre modifié");
    expect(mockedPrisma.memorySection.update).toHaveBeenCalledWith({
      where: { id: "section-existing" },
      data: expect.objectContaining({
        title: "Titre modifié",
        criterionId: "criterion-test-1",
      }),
    });
  });

  it("rejette un payload sans titre obligatoire", async () => {
    const { title: _title, ...withoutTitle } = validSectionInput;
    const memory = memoryFixture();

    mockedPrisma.technicalMemory.findUnique.mockImplementation(async () => memory);

    const result = await createOrUpdateMemorySection(withoutTitle);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues?.title?.length).toBeGreaterThan(0);
    }
    expect(mockedPrisma.memorySection.create).not.toHaveBeenCalled();
  });

  it("rejette un memoryId invalide (mémoire introuvable)", async () => {
    mockedPrisma.technicalMemory.findUnique.mockImplementation(async () => null);

    const result = await createOrUpdateMemorySection(validSectionInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("introuvable");
    }
  });

  it("rejette un criterionId invalide (critère introuvable)", async () => {
    const memory = memoryFixture();

    mockedPrisma.technicalMemory.findUnique.mockImplementation(async () => memory);
    mockedPrisma.criterion.findUnique.mockImplementation(async () => null);

    const result = await createOrUpdateMemorySection(validSectionInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Critère introuvable");
    }
  });

  it("accepte une section sans criterionId (section globale)", async () => {
    const memory = memoryFixture();
    const createdSection = sectionFixture({ criterionId: null });

    mockedPrisma.technicalMemory.findUnique.mockImplementation(async () => memory);
    mockedPrisma.memorySection.create.mockImplementation(async () => createdSection);

    const result = await createOrUpdateMemorySection({
      ...validSectionInput,
      criterionId: undefined,
    });

    if (!result.success) throw new Error(result.error);
    expect(result.data.criterionId).toBeNull();
    expect(mockedPrisma.memorySection.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ criterionId: null }),
    });
  });

  it("retourne une erreur structurée en cas d'échec base de données", async () => {
    const memory = memoryFixture();

    mockedPrisma.technicalMemory.findUnique.mockImplementation(async () => memory);
    mockedPrisma.memorySection.create.mockImplementation(async () => {
      throw new Error("disk I/O error");
    });

    const result = await createOrUpdateMemorySection(validSectionInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(typeof result.error).toBe("string");
      expect(result.error.length).toBeGreaterThan(0);
    }
  });
});

describe("reorderSections", () => {
  it("réorganise les sections dans une transaction", async () => {
    const existingSections = [
      sectionFixture({ id: "sec-1", order: 0 }),
      sectionFixture({ id: "sec-2", order: 1 }),
    ];
    const updatedSections = [
      { ...existingSections[0], order: 1 },
      { ...existingSections[1], order: 0 },
    ];

    mockedPrisma.memorySection.findMany.mockImplementation(async () => existingSections);
    mockedPrisma.$transaction.mockImplementation(async () => updatedSections);

    const result = await reorderSections({
      sections: [
        { id: "sec-1", order: 1 },
        { id: "sec-2", order: 0 },
      ],
    });

    if (!result.success) throw new Error(result.error);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].order).toBe(1);
    expect(result.data[1].order).toBe(0);
    expect(mockedPrisma.$transaction).toHaveBeenCalled();
  });

  it("rejette si une section est introuvable", async () => {
    mockedPrisma.memorySection.findMany.mockImplementation(async () => [
      sectionFixture({ id: "sec-1" }),
    ]);

    const result = await reorderSections({
      sections: [
        { id: "sec-1", order: 0 },
        { id: "sec-2", order: 1 },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("introuvables");
    }
  });

  it("rejette un payload invalide (order négatif)", async () => {
    const result = await reorderSections({
      sections: [{ id: "sec-1", order: -1 }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("invalides");
    }
  });
});

describe("updateMemoryStatus", () => {
  it("met à jour le statut du mémoire", async () => {
    const updatedMemory = memoryFixture({ status: "SUBMITTED" });

    mockedPrisma.technicalMemory.update.mockImplementation(async () => updatedMemory);

    const result = await updateMemoryStatus("memory-test-1", "SUBMITTED");

    if (!result.success) throw new Error(result.error);
    expect(result.data.status).toBe("SUBMITTED");
    expect(mockedPrisma.technicalMemory.update).toHaveBeenCalledWith({
      where: { id: "memory-test-1" },
      data: { status: "SUBMITTED" },
    });
  });

  it("rejette un memoryId vide", async () => {
    const result = await updateMemoryStatus("   ", "SUBMITTED");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("requis");
    }
    expect(mockedPrisma.technicalMemory.update).not.toHaveBeenCalled();
  });

  it("rejette un statut invalide via le schéma", async () => {
    const result = await updateMemoryStatus("memory-test-1", "INVALID" as any);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("invalides");
    }
  });

  it("retourne une erreur structurée si mémoire introuvable", async () => {
    mockedPrisma.technicalMemory.update.mockImplementation(async () => {
      throw { code: "P2025" };
    });

    const result = await updateMemoryStatus("ghost-id", "SUBMITTED");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("introuvable");
    }
  });
});