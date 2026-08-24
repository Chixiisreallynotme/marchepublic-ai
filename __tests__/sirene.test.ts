import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SireneCompany } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  lookupSirene,
  getSireneCompany,
} from "@/lib/actions/sirene";
import type { SireneCompany as SireneCompanyType, LookupSireneInput } from "@/lib/schemas/sirene";
import {
  sirenSchema,
  siretSchema,
  sireneCompanySchema,
  lookupSireneSchema,
  type SirenInput,
  type SiretInput,
} from "@/lib/schemas/sirene";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    sireneCompany: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

const mockedPrisma = vi.mocked(prisma, true);

const SIRENE_COMPANY_FIXTURE: SireneCompany = {
  id: "sirene-1",
  siren: "123456789",
  nic: "00001",
  denomination: "ENTREPRISE TEST SAS",
  legalForm: "SAS",
  activityCode: "4299Z",
  address: "1 Rue de l'Exemple",
  postalCode: "75001",
  city: "Paris",
  fetchedAt: new Date("2026-08-20T12:00:00.000Z"),
};

const validLookupInput: LookupSireneInput = { siren: "123456789" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("lib/schemas/sirene", () => {
  describe("sirenSchema", () => {
    it("valide un SIREN correct à 9 chiffres", () => {
      const parsed = sirenSchema.parse("123456789");
      expect(parsed).toBe("123456789");
    });

    it("rejette un SIREN trop court", () => {
      const result = sirenSchema.safeParse("12345678");
      expect(result.success).toBe(false);
    });

    it("rejette un SIREN trop long", () => {
      const result = sirenSchema.safeParse("1234567890");
      expect(result.success).toBe(false);
    });

    it("rejette un SIREN avec des lettres", () => {
      const result = sirenSchema.safeParse("12345678a");
      expect(result.success).toBe(false);
    });

    it("supprime les espaces", () => {
      const parsed = sirenSchema.parse("  123456789  ");
      expect(parsed).toBe("123456789");
    });

    it("rejette une chaîne vide", () => {
      const result = sirenSchema.safeParse("");
      expect(result.success).toBe(false);
    });
  });

  describe("siretSchema", () => {
    it("valide un SIRET correct à 14 chiffres", () => {
      const parsed = siretSchema.parse("12345678900001");
      expect(parsed).toBe("12345678900001");
    });

    it("rejette un SIRET trop court", () => {
      const result = siretSchema.safeParse("1234567890000");
      expect(result.success).toBe(false);
    });

    it("rejette un SIRET avec des lettres", () => {
      const result = siretSchema.safeParse("1234567890000a");
      expect(result.success).toBe(false);
    });
  });

  describe("sireneCompanySchema", () => {
    it("valide une entreprise Sirene complète", () => {
      const parsed = sireneCompanySchema.parse({
        siren: "123456789",
        nic: "00001",
        denomination: "ENTREPRISE TEST SAS",
        legalForm: "SAS",
        activityCode: "4299Z",
        address: "1 Rue de l'Exemple",
        postalCode: "75001",
        city: "Paris",
        fetchedAt: new Date(),
      });
      expect(parsed.siren).toBe("123456789");
      expect(parsed.denomination).toBe("ENTREPRISE TEST SAS");
    });

    it("accepte les champs optionnels manquants", () => {
      const parsed = sireneCompanySchema.parse({
        siren: "123456789",
        denomination: "ENTREPRISE TEST SAS",
      });
      expect(parsed.nic).toBeUndefined();
      expect(parsed.legalForm).toBeUndefined();
    });

    it("rejette une dénomination trop courte", () => {
      const result = sireneCompanySchema.safeParse({
        siren: "123456789",
        denomination: "A",
      });
      expect(result.success).toBe(false);
    });

    it("rejette un code postal invalide", () => {
      const result = sireneCompanySchema.safeParse({
        siren: "123456789",
        denomination: "ENTREPRISE TEST SAS",
        postalCode: "7500",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("lookupSireneSchema", () => {
    it("valide un input de recherche", () => {
      const parsed = lookupSireneSchema.parse({ siren: "123456789" });
      expect(parsed.siren).toBe("123456789");
    });
  });
});

describe("lookupSirene", () => {
  it("retourne l'entreprise depuis le cache si fraîche", async () => {
    const freshCompany = { ...SIRENE_COMPANY_FIXTURE, fetchedAt: new Date() };
    mockedPrisma.sireneCompany.findUnique.mockResolvedValueOnce(freshCompany);

    const result = await lookupSirene(validLookupInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.siren).toBe("123456789");
      expect(result.data.denomination).toBe("ENTREPRISE TEST SAS");
    }
    expect(mockedPrisma.sireneCompany.upsert).not.toHaveBeenCalled();
  });

  it("fetch depuis l'API/mock si pas en cache", async () => {
    mockedPrisma.sireneCompany.findUnique.mockResolvedValueOnce(null);
    const upserted = { ...SIRENE_COMPANY_FIXTURE, id: "new-sirene" };
    mockedPrisma.sireneCompany.upsert.mockResolvedValueOnce(upserted);

    const result = await lookupSirene(validLookupInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.siren).toBe("123456789");
    }
    expect(mockedPrisma.sireneCompany.upsert).toHaveBeenCalled();
  });

  it("retourne le cache même si expiré et met à jour en arrière-plan", async () => {
    const expiredCompany = { ...SIRENE_COMPANY_FIXTURE, fetchedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) };
    mockedPrisma.sireneCompany.findUnique.mockResolvedValueOnce(expiredCompany);
    const upserted = { ...SIRENE_COMPANY_FIXTURE, fetchedAt: new Date() };
    mockedPrisma.sireneCompany.upsert.mockResolvedValueOnce(upserted);

    const result = await lookupSirene(validLookupInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.siren).toBe("123456789");
    }
    expect(mockedPrisma.sireneCompany.upsert).toHaveBeenCalled();
  });

  it("rejette un SIREN invalide", async () => {
    const result = await lookupSirene({ siren: "123" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("invalide");
    }
    expect(mockedPrisma.sireneCompany.findUnique).not.toHaveBeenCalled();
  });

  it("gère les erreurs de base de données", async () => {
    mockedPrisma.sireneCompany.findUnique.mockRejectedValueOnce(new Error("DB error"));

    const result = await lookupSirene(validLookupInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("erreur interne");
    }
  });
});

describe("getSireneCompany", () => {
  it("retourne l'entreprise depuis la base", async () => {
    mockedPrisma.sireneCompany.findUnique.mockResolvedValueOnce(SIRENE_COMPANY_FIXTURE);

    const result = await getSireneCompany("123456789");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.siren).toBe("123456789");
    }
  });

  it("retourne null si l'entreprise n'existe pas", async () => {
    mockedPrisma.sireneCompany.findUnique.mockResolvedValueOnce(null);

    const result = await getSireneCompany("999999999");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeNull();
    }
  });

  it("rejette un SIREN invalide", async () => {
    const result = await getSireneCompany("invalid");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("invalide");
    }
  });
});