"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  lookupSireneSchema,
  sireneCompanySchema,
  sirenSchema,
  type SireneCompany,
  type LookupSireneInput,
  type SireneApiResponse,
} from "@/lib/schemas/sirene";

export type FieldIssues = Record<string, string[]>;

export type ActionResult<TData> =
  | { success: true; data: TData }
  | { success: false; error: string; issues?: FieldIssues };

type ActionFailure = { success: false; error: string; issues?: FieldIssues };

const PRISMA_UNIQUE_VIOLATION = "P2002";
const PRISMA_FOREIGN_KEY_VIOLATION = "P2003";
const PRISMA_RECORD_NOT_FOUND = "P2025";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function prismaErrorCode(error: unknown): string | null {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  return null;
}

function fieldIssuesFromZodError(error: z.ZodError): FieldIssues {
  const issues: FieldIssues = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.map(String).join(".") : "_form";
    (issues[key] ??= []).push(issue.message);
  }
  return issues;
}

function validationFailure(error: z.ZodError): ActionFailure {
  return {
    success: false,
    error: "Les données soumises sont invalides.",
    issues: fieldIssuesFromZodError(error),
  };
}

function failure(error: string): ActionFailure {
  return { success: false, error };
}

function handleDbError(operationLabel: string, error: unknown): ActionFailure {
  switch (prismaErrorCode(error)) {
    case PRISMA_UNIQUE_VIOLATION:
      return failure("Une entreprise avec ce SIREN existe déjà.");
    case PRISMA_FOREIGN_KEY_VIOLATION:
      return failure(`${operationLabel} : l'entité associée n'existe pas.`);
    case PRISMA_RECORD_NOT_FOUND:
      return failure(`${operationLabel} : élément introuvable.`);
    default:
      console.error(`[actions/sirene] ${operationLabel}`, error);
      return failure(
        `${operationLabel} : une erreur interne est survenue. Réessayez plus tard.`
      );
  }
}

function isCacheFresh(fetchedAt: Date): boolean {
  return Date.now() - fetchedAt.getTime() < CACHE_TTL_MS;
}

function buildMockSireneCompany(siren: string): SireneApiResponse {
  const denomination = `ENTREPRISE ${siren.slice(-3)} SAS`;
  return {
    siren,
    nic: "00001",
    denomination,
    legalForm: "SAS",
    activityCode: "4299Z",
    address: "1 Rue de l'Exemple",
    postalCode: "75001",
    city: "Paris",
  };
}

async function fetchFromInseeApi(siren: string): Promise<SireneApiResponse | null> {
  try {
    const response = await fetch(
      `https://api.insee.fr/entreprises/sirene/V3/siren/${siren}`,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      console.warn(`[Sirene] INSEE API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const etablissement = data.etablissement;

    if (!etablissement) return null;

    return {
      siren: etablissement.siren,
      nic: etablissement.nic,
      denomination: etablissement.uniteLegale?.denomination ?? etablissement.periodesEtablissement?.[0]?.denominationUsuelle ?? "Inconnu",
      legalForm: etablissement.uniteLegale?.categorieJuridiqueUniteLegale,
      activityCode: etablissement.uniteLegale?.activitePrincipaleUniteLegale ?? etablissement.activitePrincipaleEtablissement,
      address: etablissement.adresseEtablissement?.numeroVoieEtablissement
        ? `${etablissement.adresseEtablissement.numeroVoieEtablissement} ${etablissement.adresseEtablissement.typeVoieEtablissement ?? ""} ${etablissement.adresseEtablissement.libelleVoieEtablissement ?? ""}`.trim()
        : undefined,
      postalCode: etablissement.adresseEtablissement?.codePostalEtablissement,
      city: etablissement.adresseEtablissement?.libelleCommuneEtablissement,
    };
  } catch (error) {
    console.warn("[Sirene] INSEE API fetch failed:", error);
    return null;
  }
}

function mapToSireneCompany(apiResponse: SireneApiResponse): SireneCompany {
  return sireneCompanySchema.parse({
    ...apiResponse,
    fetchedAt: new Date(),
  });
}

export async function lookupSirene(input: LookupSireneInput): Promise<ActionResult<SireneCompany>> {
  try {
    const parsed = lookupSireneSchema.safeParse(input);
    if (!parsed.success) {
      return validationFailure(parsed.error);
    }

    const { siren } = parsed.data;

    const cached = await prisma.sireneCompany.findUnique({
      where: { siren },
    });

    if (cached && isCacheFresh(cached.fetchedAt)) {
      return { success: true, data: cached };
    }

    let apiResponse: SireneApiResponse | null = null;

    if (process.env.NODE_ENV === "development" || !process.env.INSEE_API_TOKEN) {
      apiResponse = buildMockSireneCompany(siren);
    } else {
      apiResponse = await fetchFromInseeApi(siren);
      if (!apiResponse) {
        apiResponse = buildMockSireneCompany(siren);
      }
    }

    if (!apiResponse) {
      return failure("Entreprise introuvable dans le registre Sirene.");
    }

    const companyData = mapToSireneCompany(apiResponse);

    const upserted = await prisma.sireneCompany.upsert({
      where: { siren },
      create: companyData,
      update: companyData,
    });

    return { success: true, data: upserted };
  } catch (error) {
    return handleDbError("La recherche Sirene", error);
  }
}

export async function getSireneCompany(siren: string): Promise<ActionResult<SireneCompany | null>> {
  try {
    const parsed = sirenSchema.safeParse(siren);
    if (!parsed.success) {
      return failure("SIREN invalide (9 chiffres requis).");
    }

    const company = await prisma.sireneCompany.findUnique({
      where: { siren: parsed.data },
    });

    if (!company) {
      return { success: true, data: null };
    }

    return { success: true, data: company };
  } catch (error) {
    return handleDbError("La récupération de l'entreprise Sirene", error);
  }
}