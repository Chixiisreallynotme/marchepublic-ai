import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CerfaDocument, TechnicalMemory, Tender } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  generateCerfa,
  getCerfaById,
  getCerfaDocuments,
} from "@/lib/actions/cerfa";
import type { CerfaDocumentWithRelations } from "@/lib/actions/cerfa";
import {
  cerfaDocumentSchema,
  dc1Schema,
  dc2Schema,
  dc4Schema,
  noti2Schema,
  generateCerfaSchema,
} from "@/lib/schemas/cerfa";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    cerfaDocument: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    technicalMemory: {
      findUnique: vi.fn(),
    },
  },
}));

const mockedPrisma = vi.mocked(prisma, true);

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
  organizationId: "org-novatech",
} as Tender;

const MEMORY = {
  id: "memory-test-1",
  title: "Mémoire technique - Mobilier urbain",
  status: "DRAFT",
  summary: null,
  createdAt: new Date("2026-08-20T08:00:00.000Z"),
  updatedAt: new Date("2026-08-20T08:00:00.000Z"),
  tenderId: "tender-test-1",
  organizationId: "org-novatech",
} as TechnicalMemory;

function cerfaDocFixture(
  overrides: Partial<CerfaDocument> = {}
): CerfaDocument {
  return {
    id: "cerfa-test-1",
    formNumber: "DC1",
    label: "Lettre de candidature (DC1 - Cerfa 11197)",
    payload: JSON.stringify({
      formType: "DC1",
      tenderReference: "AO-2026-100-MU",
      buyerName: "Métropole de Lyon",
      buyerAddress: {},
      candidate: {
        denomination: "Novatech BTP SAS",
        siren: "123456789",
        isGroup: false,
      },
      signatory: {
        firstName: "Jean",
        lastName: "Dupont",
        role: "Président",
      },
    }),
    fileUrl: null,
    createdAt: new Date("2026-08-20T10:00:00.000Z"),
    memoryId: "memory-test-1",
    ...overrides,
  };
}

const validGenerateInput = {
  tenderId: "tender-test-1",
  memoryId: "memory-test-1",
  formType: "DC1" as const,
  payload: {
    formType: "DC1" as const,
    tenderReference: "AO-2026-100-MU",
    buyerName: "Métropole de Lyon",
    buyerAddress: {
      address: "1 Rue de la Mairie",
      postalCode: "69001",
      city: "Lyon",
    },
    candidate: {
      denomination: "Novatech BTP SAS",
      siren: "123456789",
      siret: "12345678900001",
      legalForm: "SAS",
      activityCode: "4299Z",
      address: "10 Rue de l'Entreprise",
      postalCode: "69002",
      city: "Lyon",
      email: "contact@novatech.fr",
      phone: "04 78 00 00 00",
      isGroup: false,
    },
    representative: {
      firstName: "Jean",
      lastName: "Dupont",
      role: "Président",
      email: "jean.dupont@novatech.fr",
      phone: "06 00 00 00 00",
    },
    signatory: {
      firstName: "Jean",
      lastName: "Dupont",
      role: "Président",
    },
    declarationDate: new Date("2026-08-20"),
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("lib/schemas/cerfa", () => {
  it("CERFA_FORM_TYPES contient les 4 types attendus", () => {
    expect(cerfaDocumentSchema.options).toHaveLength(4);
    const formTypes = cerfaDocumentSchema.options.map((opt) => opt.shape.formType.value);
    expect(formTypes).toContain("DC1");
    expect(formTypes).toContain("DC2");
    expect(formTypes).toContain("DC4");
    expect(formTypes).toContain("NOTI2");
  });

  describe("dc1Schema", () => {
    it("valide un payload DC1 complet", () => {
      const payload = {
        formType: "DC1",
        tenderReference: "AO-2026-100-MU",
        buyerName: "Métropole de Lyon",
        buyerAddress: {
          address: "1 Rue de la Mairie",
          postalCode: "69001",
          city: "Lyon",
        },
        candidate: {
          denomination: "Novatech BTP SAS",
          siren: "123456789",
          isGroup: false,
        },
        signatory: {
          firstName: "Jean",
          lastName: "Dupont",
          role: "Président",
        },
      };
      const parsed = dc1Schema.safeParse(payload);
      expect(parsed.success).toBe(true);
    });

    it("rejette un SIREN invalide (pas 9 chiffres)", () => {
      const payload = {
        formType: "DC1",
        tenderReference: "AO-2026-100-MU",
        buyerName: "Métropole de Lyon",
        buyerAddress: {},
        candidate: {
          denomination: "Novatech BTP SAS",
          siren: "12345",
          isGroup: false,
        },
        signatory: {
          firstName: "Jean",
          lastName: "Dupont",
          role: "Président",
        },
      };
      const parsed = dc1Schema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });

    it("applique isGroup=false par défaut", () => {
      const payload = {
        formType: "DC1",
        tenderReference: "AO-2026-100-MU",
        buyerName: "Métropole de Lyon",
        buyerAddress: {},
        candidate: {
          denomination: "Novatech BTP SAS",
        },
        signatory: {
          firstName: "Jean",
          lastName: "Dupont",
          role: "Président",
        },
      };
      const parsed = dc1Schema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.candidate.isGroup).toBe(false);
      }
    });
  });

  describe("dc2Schema", () => {
    it("valide un payload DC2 avec capacités", () => {
      const payload = {
        formType: "DC2",
        tenderReference: "AO-2026-100-MU",
        buyerName: "Métropole de Lyon",
        candidate: {
          denomination: "Novatech BTP SAS",
          siren: "123456789",
        },
        capacity: {
          legal: [{ description: "Inscrit au RCS", evidence: "KBIS" }],
          technical: [{ description: "Certifié ISO 9001", evidence: "Certificat" }],
          financial: [{ description: "CA > 1M€", evidence: "Bilan" }],
        },
        signatory: {
          firstName: "Jean",
          lastName: "Dupont",
          role: "Président",
        },
      };
      const parsed = dc2Schema.safeParse(payload);
      expect(parsed.success).toBe(true);
    });

    it("accepte des capacités optionnelles", () => {
      const payload = {
        formType: "DC2",
        tenderReference: "AO-2026-100-MU",
        buyerName: "Métropole de Lyon",
        candidate: {
          denomination: "Novatech BTP SAS",
        },
        signatory: {
          firstName: "Jean",
          lastName: "Dupont",
          role: "Président",
        },
      };
      const parsed = dc2Schema.safeParse(payload);
      expect(parsed.success).toBe(true);
    });
  });

  describe("dc4Schema", () => {
    it("valide un payload DC4 avec sous-traitance", () => {
      const payload = {
        formType: "DC4",
        tenderReference: "AO-2026-100-MU",
        buyerName: "Métropole de Lyon",
        buyerAddress: {
          address: "1 Rue de la Mairie",
          postalCode: "69001",
          city: "Lyon",
        },
        subcontractor: {
          denomination: "Sous-Traitant SAS",
          siren: "987654321",
          mainContractorSiren: "123456789",
          contractDescription: "Lot électricité",
          contractValue: 50000,
        },
        signatory: {
          firstName: "Marie",
          lastName: "Martin",
          role: "Directrice",
        },
      };
      const parsed = dc4Schema.safeParse(payload);
      expect(parsed.success).toBe(true);
    });

    it("rejette un contractValue négatif", () => {
      const payload = {
        formType: "DC4",
        tenderReference: "AO-2026-100-MU",
        buyerName: "Métropole de Lyon",
        buyerAddress: {},
        subcontractor: {
          denomination: "Sous-Traitant SAS",
          siren: "987654321",
          mainContractorSiren: "123456789",
          contractDescription: "Lot électricité",
          contractValue: -1000,
        },
        signatory: {
          firstName: "Marie",
          lastName: "Martin",
          role: "Directrice",
        },
      };
      const parsed = dc4Schema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });
  });

  describe("noti2Schema", () => {
    it("valide un payload NOTI2 avec documents", () => {
      const payload = {
        formType: "NOTI2",
        tenderReference: "AO-2026-100-MU",
        buyerName: "Métropole de Lyon",
        buyerAddress: {},
        candidate: {
          denomination: "Novatech BTP SAS",
        },
        documents: [
          {
            type: "KBIS",
            description: "Extrait Kbis de moins de 3 mois",
            reference: "KBIS-2026",
            fileUrl: "https://example.com/kbis.pdf",
          },
        ],
        signatory: {
          firstName: "Jean",
          lastName: "Dupont",
          role: "Président",
        },
      };
      const parsed = noti2Schema.safeParse(payload);
      expect(parsed.success).toBe(true);
    });

    it("rejette si aucun document fourni", () => {
      const payload = {
        formType: "NOTI2",
        tenderReference: "AO-2026-100-MU",
        buyerName: "Métropole de Lyon",
        buyerAddress: {},
        candidate: {
          denomination: "Novatech BTP SAS",
        },
        documents: [],
        signatory: {
          firstName: "Jean",
          lastName: "Dupont",
          role: "Président",
        },
      };
      const parsed = noti2Schema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });
  });

  describe("generateCerfaSchema", () => {
    it("valide un input de génération complet", () => {
      const parsed = generateCerfaSchema.safeParse(validGenerateInput);
      expect(parsed.success).toBe(true);
    });

    it("rejette un tenderId invalide (vide)", () => {
      const parsed = generateCerfaSchema.safeParse({
        ...validGenerateInput,
        tenderId: "",
      });
      expect(parsed.success).toBe(false);
    });

    it("rejette un memoryId invalide (vide)", () => {
      const parsed = generateCerfaSchema.safeParse({
        ...validGenerateInput,
        memoryId: "",
      });
      expect(parsed.success).toBe(false);
    });

    it("rejette un formType invalide", () => {
      const parsed = generateCerfaSchema.safeParse({
        ...validGenerateInput,
        formType: "DC99",
      });
      expect(parsed.success).toBe(false);
    });
  });
});

describe("generateCerfa", () => {
  it("génère un document CERFA depuis un payload valide", async () => {
    const createdDoc = cerfaDocFixture();
    
    mockedPrisma.technicalMemory.findUnique.mockResolvedValueOnce({
      ...MEMORY,
      tender: TENDER,
    });
    mockedPrisma.cerfaDocument.create.mockResolvedValueOnce(createdDoc);

    const result = await generateCerfa(validGenerateInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.formNumber).toBe("DC1");
      expect(result.data.label).toBe("Lettre de candidature (DC1 - Cerfa 11197)");
    }
    expect(mockedPrisma.cerfaDocument.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        formNumber: "DC1",
        label: "Lettre de candidature (DC1 - Cerfa 11197)",
        memoryId: "memory-test-1",
        payload: expect.stringContaining("DC1"),
      }),
    });
  });

  it("rejette si le mémoire technique n'existe pas", async () => {
    mockedPrisma.technicalMemory.findUnique.mockResolvedValueOnce(null);

    const result = await generateCerfa(validGenerateInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Mémoire technique introuvable");
    }
  });

  it("rejette si le mémoire n'appartient pas à l'appel d'offres", async () => {
    mockedPrisma.technicalMemory.findUnique.mockResolvedValueOnce({
      ...MEMORY,
      tenderId: "other-tender-id",
      tender: { ...TENDER, id: "other-tender-id" },
    });

    const result = await generateCerfa(validGenerateInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("n'appartient pas");
    }
  });

  it("rejette un payload invalide (schéma CERFA)", async () => {
    const invalidInput = {
      ...validGenerateInput,
      payload: {
        formType: "DC1",
        tenderReference: "",
        buyerName: "",
        buyerAddress: {},
        candidate: { denomination: "" },
        signatory: { firstName: "", lastName: "", role: "" },
      },
    };

    mockedPrisma.technicalMemory.findUnique.mockResolvedValueOnce({
      ...MEMORY,
      tender: TENDER,
    });

    const result = await generateCerfa(invalidInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("invalides");
    }
  });

  it("retourne une erreur structurée en cas d'échec base de données", async () => {
    mockedPrisma.technicalMemory.findUnique.mockResolvedValueOnce({
      ...MEMORY,
      tender: TENDER,
    });
    mockedPrisma.cerfaDocument.create.mockRejectedValueOnce(
      new Error("disk I/O error")
    );

    const result = await generateCerfa(validGenerateInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(typeof result.error).toBe("string");
      expect(result.error.length).toBeGreaterThan(0);
    }
  });
});

describe("getCerfaDocuments", () => {
  it("retourne la liste des documents CERFA pour un appel d'offres", async () => {
    const docs = [cerfaDocFixture(), cerfaDocFixture({ id: "cerfa-test-2", formNumber: "DC2" })];
    
    mockedPrisma.cerfaDocument.findMany.mockResolvedValueOnce(
      docs.map((d) => ({ ...d, memory: { id: "memory-test-1", tenderId: "tender-test-1" } }))
    );

    const result = await getCerfaDocuments("tender-test-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].formNumber).toBe("DC1");
      expect(result.data[1].formNumber).toBe("DC2");
    }
    expect(mockedPrisma.cerfaDocument.findMany).toHaveBeenCalledWith({
      where: { memory: { tenderId: "tender-test-1" } },
      orderBy: { createdAt: "desc" },
      include: { memory: { select: { id: true, tenderId: true } } },
    });
  });

  it("retourne un tableau vide si aucun document", async () => {
    mockedPrisma.cerfaDocument.findMany.mockResolvedValueOnce([]);

    const result = await getCerfaDocuments("tender-test-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
  });

  it("rejette un tenderId vide", async () => {
    const result = await getCerfaDocuments("   ");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("requis");
    }
    expect(mockedPrisma.cerfaDocument.findMany).not.toHaveBeenCalled();
  });

  it("retourne une erreur structurée en cas d'échec base de données", async () => {
    mockedPrisma.cerfaDocument.findMany.mockRejectedValueOnce(
      new Error("connection refused")
    );

    const result = await getCerfaDocuments("tender-test-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("erreur interne");
    }
  });
});

describe("getCerfaById", () => {
  it("retourne un document CERFA par son ID", async () => {
    const doc = cerfaDocFixture();
    
    mockedPrisma.cerfaDocument.findUnique.mockResolvedValueOnce({
      ...doc,
      memory: { id: "memory-test-1", tenderId: "tender-test-1" },
    });

    const result = await getCerfaById("cerfa-test-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.id).toBe("cerfa-test-1");
      expect(result.data?.formNumber).toBe("DC1");
    }
    expect(mockedPrisma.cerfaDocument.findUnique).toHaveBeenCalledWith({
      where: { id: "cerfa-test-1" },
      include: { memory: { select: { id: true, tenderId: true } } },
    });
  });

  it("retourne null si le document n'existe pas", async () => {
    mockedPrisma.cerfaDocument.findUnique.mockResolvedValueOnce(null);

    const result = await getCerfaById("missing-id");

    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
  });

  it("rejette un ID vide", async () => {
    const result = await getCerfaById("   ");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("requis");
    }
    expect(mockedPrisma.cerfaDocument.findUnique).not.toHaveBeenCalled();
  });

  it("retourne une erreur structurée en cas d'échec base de données", async () => {
    mockedPrisma.cerfaDocument.findUnique.mockRejectedValueOnce(
      new Error("connection refused")
    );

    const result = await getCerfaById("cerfa-test-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("erreur interne");
    }
  });
});