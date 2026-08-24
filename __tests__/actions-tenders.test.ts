import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Criterion, Organization, Tender } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createCriterion,
  createTender,
  deleteCriterion,
  deleteTender,
  getTenderById,
  getTenders,
  updateCriterion,
  updateTender,
} from "@/lib/actions/tenders";
import type { TenderWithCounts, TenderWithRelations } from "@/lib/actions/tenders";
import {
  createCriterionSchema,
  createTenderSchema,
  updateCriterionSchema,
  updateTenderSchema,
} from "@/lib/schemas/tender";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tender: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    criterion: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const mockedPrisma = vi.mocked(prisma, true);

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

type TenderRow = Tender & {
  organization?: Organization;
  criteria?: Criterion[];
  _count?: { criteria: number };
};

function tenderFixture(overrides: Partial<TenderRow> = {}): TenderRow {
  return {
    id: "tender-test-1",
    title: "Fourniture et pose de mobilier urbain",
    reference: "AO-2026-100-MU",
    description: null,
    status: "DRAFT",
    procedureType: "APPEL_OFFRES_OUVERT",
    cpvCode: "34992100-1",
    buyerName: "Métropole de Lyon",
    estimatedValue: 120000,
    dceUrl: null,
    publicationDate: null,
    deadline: new Date("2026-11-30T17:00:00.000Z"),
    createdAt: new Date("2026-08-20T08:00:00.000Z"),
    updatedAt: new Date("2026-08-20T08:00:00.000Z"),
    organizationId: ORGANIZATION.id,
    organization: ORGANIZATION,
    criteria: [],
    _count: { criteria: 0 },
    ...overrides,
  };
}

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
    tender: tenderFixture({ id: "tender-test-1" }),
    ...overrides,
  } as Criterion;
}

const validTenderInput = {
  title: "Fourniture et pose de mobilier urbain",
  reference: "AO-2026-100-MU",
  buyerName: "Métropole de Lyon",
  cpvCode: "34992100-1",
  estimatedValue: 120000,
  deadline: "2026-11-30T17:00:00.000Z",
  organizationId: ORGANIZATION.id,
};

const validCriterionInput = {
  title: "Démarche environnementale et RSE",
  description: "Politique environnementale et chantier bas carbone.",
  weight: 15,
  order: 3,
  tenderId: "tender-test-1",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("lib/schemas/tender", () => {
  it("createTenderSchema applique les valeurs par défaut et nettoie le titre", () => {
    const parsed = createTenderSchema.parse({
      title: "  Travaux de réfection de toiture  ",
      reference: "AO-2026-101-TO",
      organizationId: ORGANIZATION.id,
    });

    expect(parsed.title).toBe("Travaux de réfection de toiture");
    expect(parsed.status).toBe("DRAFT");
    expect(parsed.procedureType).toBe("APPEL_OFFRES_OUVERT");
    expect(parsed.deadline).toBeUndefined();
  });

  it("createTenderSchema convertit une date limite ISO en objet Date", () => {
    const parsed = createTenderSchema.parse({
      ...validTenderInput,
      deadline: "2027-01-15T12:00:00.000Z",
    });
    expect(parsed.deadline).toEqual(new Date("2027-01-15T12:00:00.000Z"));
  });

  it("updateTenderSchema accepte un payload partiel vide", () => {
    const parsed = updateTenderSchema.safeParse({});
    expect(parsed.success).toBe(true);
  });

  it("rejette un statut inconnu", () => {
    const parsed = updateTenderSchema.safeParse({ status: "PUBLIÉ" });
    expect(parsed.success).toBe(false);
  });

  it("rejette un code CPV malformé", () => {
    const parsed = updateTenderSchema.safeParse({ cpvCode: "45261210" });
    expect(parsed.success).toBe(false);
  });

  it("createCriterionSchema positionne weight=1 et order=0 par défaut", () => {
    const parsed = createCriterionSchema.parse({
      title: "Prix des prestations",
      tenderId: "tender-test-1",
    });
    expect(parsed.weight).toBe(1);
    expect(parsed.order).toBe(0);
  });

  it("updateCriterionSchema valide une modification partielle du poids", () => {
    const parsed = updateCriterionSchema.safeParse({ weight: 25 });
    expect(parsed.success).toBe(true);
  });
});

describe("getTenders", () => {
  it("retourne la liste des appels d'offres en cas de succès", async () => {
    const tenders = [tenderFixture(), tenderFixture({ id: "tender-test-2" })];
    vi.mocked(mockedPrisma.tender.findMany).mockResolvedValueOnce(tenders as TenderWithCounts[]);

    const result = await getTenders();

    if (!result.success) throw new Error(result.error);
    expect(result.data).toHaveLength(2);
    expect(mockedPrisma.tender.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined })
    );
  });

  it("filtre par organizationId lorsque fourni", async () => {
    vi.mocked(mockedPrisma.tender.findMany).mockResolvedValueOnce([]);

    const result = await getTenders(ORGANIZATION.id);

    if (!result.success) throw new Error(result.error);
    expect(result.success).toBe(true);
    expect(mockedPrisma.tender.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: ORGANIZATION.id } })
    );
  });

  it("retourne une erreur structurée sans lever d'exception si la base échoue", async () => {
    vi.mocked(mockedPrisma.tender.findMany).mockRejectedValueOnce(
      new Error("connection refused")
    );

    const result = await getTenders();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("erreur interne");
    }
  });
});

describe("getTenderById", () => {
  it("retourne l'appel d'offres avec ses critères et son organisation", async () => {
    const fullTender = tenderFixture({ criteria: [criterionFixture()] });
    vi.mocked(mockedPrisma.tender.findUnique).mockResolvedValueOnce(
      fullTender as TenderWithRelations
    );

    const result = await getTenderById("tender-test-1");

    if (!result.success) throw new Error(result.error);
    expect(result.data.id).toBe("tender-test-1");
    expect(result.data.criteria).toHaveLength(1);
    expect(mockedPrisma.tender.findUnique).toHaveBeenCalledWith({
      where: { id: "tender-test-1" },
      include: { organization: true, criteria: { orderBy: { order: "asc" } } },
    });
  });

  it("retourne une erreur structurée si l'appel d'offres n'existe pas", async () => {
    vi.mocked(mockedPrisma.tender.findUnique).mockResolvedValueOnce(null);

    const result = await getTenderById("missing-id");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("introuvable");
    }
  });

  it("échoue immédiatement sur un identifiant vide sans interroger la base", async () => {
    const result = await getTenderById("   ");

    expect(result.success).toBe(false);
    expect(mockedPrisma.tender.findUnique).not.toHaveBeenCalled();
  });
});

describe("createTender", () => {
  it("crée un appel d'offres depuis un payload valide (date convertie, défauts appliqués)", async () => {
    const created = tenderFixture();
    vi.mocked(mockedPrisma.tender.create).mockResolvedValueOnce(created);

    const result = await createTender(validTenderInput);

    if (!result.success) throw new Error(result.error);
    expect(result.data.reference).toBe("AO-2026-100-MU");
    expect(mockedPrisma.tender.create).toHaveBeenCalledTimes(1);
    expect(mockedPrisma.tender.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: "Fourniture et pose de mobilier urbain",
        reference: "AO-2026-100-MU",
        buyerName: "Métropole de Lyon",
        cpvCode: "34992100-1",
        estimatedValue: 120000,
        deadline: new Date("2026-11-30T17:00:00.000Z"),
        organizationId: ORGANIZATION.id,
        procedureType: "APPEL_OFFRES_OUVERT",
        status: "DRAFT",
      }),
    });
  });

  it("rejette un payload sans le titre obligatoire", async () => {
    const { title: _title, ...withoutTitle } = validTenderInput;

    const result = await createTender(withoutTitle);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues?.title?.length).toBeGreaterThan(0);
      expect(result.issues?.title?.[0]).toContain("titre");
    }
    expect(mockedPrisma.tender.create).not.toHaveBeenCalled();
  });

  it("rejette une valeur estimée négative", async () => {
    const result = await createTender({ ...validTenderInput, estimatedValue: -5000 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues?.estimatedValue?.[0]).toContain("négative");
    }
    expect(mockedPrisma.tender.create).not.toHaveBeenCalled();
  });

  it("rejette une valeur estimée non numérique", async () => {
    const result = await createTender({
      ...validTenderInput,
      estimatedValue: "120 000" as unknown as number,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues?.estimatedValue?.[0]).toContain("nombre");
    }
  });

  it("rejette un code CPV invalide", async () => {
    const result = await createTender({ ...validTenderInput, cpvCode: "45-2612109" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues?.cpvCode?.[0]).toContain("CPV");
    }
  });

  it("convertit une violation d'unicité de référence en erreur métier", async () => {
    vi.mocked(mockedPrisma.tender.create).mockRejectedValueOnce({ code: "P2002" });

    const result = await createTender(validTenderInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("référence existe déjà");
    }
  });

  it("ne lève jamais d'exception sur une erreur base de données inattendue", async () => {
    vi.mocked(mockedPrisma.tender.create).mockRejectedValueOnce(new Error("disk I/O error"));

    const result = await createTender(validTenderInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(typeof result.error).toBe("string");
      expect(result.error.length).toBeGreaterThan(0);
    }
  });
});

describe("updateTender", () => {
  it("met à jour un appel d'offres depuis un payload partiel", async () => {
    const updated = tenderFixture({ status: "PUBLISHED" });
    vi.mocked(mockedPrisma.tender.update).mockResolvedValueOnce(updated);

    const result = await updateTender("tender-test-1", { status: "PUBLISHED" });

    if (!result.success) throw new Error(result.error);
    expect(result.data.status).toBe("PUBLISHED");
    expect(mockedPrisma.tender.update).toHaveBeenCalledWith({
      where: { id: "tender-test-1" },
      data: { status: "PUBLISHED" },
    });
  });

  it("rejette un payload partiel invalide", async () => {
    const result = await updateTender("tender-test-1", { estimatedValue: -1 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues?.estimatedValue).toBeDefined();
    }
    expect(mockedPrisma.tender.update).not.toHaveBeenCalled();
  });

  it("rejette un payload vide", async () => {
    const result = await updateTender("tender-test-1", {});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Aucune donnée");
    }
    expect(mockedPrisma.tender.update).not.toHaveBeenCalled();
  });

  it("convertit une violation 'introuvable' en erreur structurée", async () => {
    vi.mocked(mockedPrisma.tender.update).mockRejectedValueOnce({ code: "P2025" });

    const result = await updateTender("ghost-id", { status: "CLOSED" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("introuvable");
    }
  });
});

describe("deleteTender", () => {
  it("supprime un appel d'offres (les critères sont supprimés en cascade)", async () => {
    const deleted = tenderFixture({ id: "tender-to-delete" });
    vi.mocked(mockedPrisma.tender.delete).mockResolvedValueOnce(deleted);

    const result = await deleteTender("tender-to-delete");

    if (!result.success) throw new Error(result.error);
    expect(result.data.id).toBe("tender-to-delete");
    expect(mockedPrisma.tender.delete).toHaveBeenCalledWith({
      where: { id: "tender-to-delete" },
    });
  });

  it("retourne une erreur structurée lors de la suppression d'un appel d'offres inexistant", async () => {
    vi.mocked(mockedPrisma.tender.delete).mockRejectedValueOnce({ code: "P2025" });

    const result = await deleteTender("ghost-id");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("introuvable");
    }
  });

  it("rejette un identifiant vide", async () => {
    const result = await deleteTender("");

    expect(result.success).toBe(false);
    expect(mockedPrisma.tender.delete).not.toHaveBeenCalled();
  });
});

describe("createCriterion", () => {
  it("crée un critère depuis un payload valide", async () => {
    const created = criterionFixture();
    vi.mocked(mockedPrisma.criterion.create).mockResolvedValueOnce(created);

    const result = await createCriterion(validCriterionInput);

    if (!result.success) throw new Error(result.error);
    expect(result.data.title).toBe("Méthodologie d'exécution");
    expect(mockedPrisma.criterion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: "Démarche environnementale et RSE",
        description: "Politique environnementale et chantier bas carbone.",
        weight: 15,
        order: 3,
        tenderId: "tender-test-1",
      }),
    });
  });

  it("rejette un poids supérieur à 100", async () => {
    const result = await createCriterion({ ...validCriterionInput, weight: 150 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues?.weight?.[0]).toContain("dépasser 100");
    }
    expect(mockedPrisma.criterion.create).not.toHaveBeenCalled();
  });

  it("rejette un poids négatif", async () => {
    const result = await createCriterion({ ...validCriterionInput, weight: -5 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues?.weight?.[0]).toContain("inférieure à 0");
    }
    expect(mockedPrisma.criterion.create).not.toHaveBeenCalled();
  });

  it("accepte les poids aux bornes 0 et 100", () => {
    expect(
      createCriterionSchema.safeParse({ ...validCriterionInput, weight: 0 }).success
    ).toBe(true);
    expect(
      createCriterionSchema.safeParse({ ...validCriterionInput, weight: 100 }).success
    ).toBe(true);
  });

  it("rejette un tenderId manquant", async () => {
    const { tenderId: _tenderId, ...withoutTenderId } = validCriterionInput;

    const result = await createCriterion(withoutTenderId);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues?.tenderId?.length).toBeGreaterThan(0);
    }
    expect(mockedPrisma.criterion.create).not.toHaveBeenCalled();
  });

  it("convertit une violation de clé étrangère (tender inexistant) en erreur métier", async () => {
    vi.mocked(mockedPrisma.criterion.create).mockRejectedValueOnce({ code: "P2003" });

    const result = await createCriterion(validCriterionInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("n'existe pas");
    }
  });
});

describe("updateCriterion", () => {
  it("met à jour le poids et l'ordre depuis un payload partiel", async () => {
    const updated = criterionFixture({ weight: 25, order: 2 });
    vi.mocked(mockedPrisma.criterion.update).mockResolvedValueOnce(updated);

    const result = await updateCriterion("criterion-test-1", { weight: 25, order: 2 });

    if (!result.success) throw new Error(result.error);
    expect(result.data.weight).toBe(25);
    expect(mockedPrisma.criterion.update).toHaveBeenCalledWith({
      where: { id: "criterion-test-1" },
      data: { weight: 25, order: 2 },
    });
  });

  it("rejette un poids hors limites sans toucher la base", async () => {
    const result = await updateCriterion("criterion-test-1", { weight: 101 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues?.weight?.[0]).toContain("dépasser 100");
    }
    expect(mockedPrisma.criterion.update).not.toHaveBeenCalled();
  });

  it("convertit une violation 'introuvable' en erreur structurée", async () => {
    vi.mocked(mockedPrisma.criterion.update).mockRejectedValueOnce({ code: "P2025" });

    const result = await updateCriterion("ghost-id", { weight: 10 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("introuvable");
    }
  });
});

describe("deleteCriterion", () => {
  it("supprime un critère", async () => {
    const deleted = criterionFixture({ id: "criterion-to-delete" });
    vi.mocked(mockedPrisma.criterion.delete).mockResolvedValueOnce(deleted);

    const result = await deleteCriterion("criterion-to-delete");

    if (!result.success) throw new Error(result.error);
    expect(result.data.id).toBe("criterion-to-delete");
    expect(mockedPrisma.criterion.delete).toHaveBeenCalledWith({
      where: { id: "criterion-to-delete" },
    });
  });

  it("retourne une erreur structurée lors de la suppression d'un critère inexistant", async () => {
    vi.mocked(mockedPrisma.criterion.delete).mockRejectedValueOnce({ code: "P2025" });

    const result = await deleteCriterion("ghost-id");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("introuvable");
    }
  });
});
