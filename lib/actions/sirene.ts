"use server";

import { z } from "zod";
import { logger } from "@/lib/logger";
import {
  PRISMA_FOREIGN_KEY_VIOLATION,
  PRISMA_RECORD_NOT_FOUND,
  PRISMA_UNIQUE_VIOLATION,
  failure,
  prismaErrorCode,
  validationFailure,
  type ActionFailure,
  type ActionResult,
  type FieldIssues,
} from "@/lib/actions/shared";
export type { ActionResult, FieldIssues } from "@/lib/actions/shared";

import { prisma } from "@/lib/prisma";
import {
  lookupSireneSchema,
  sireneCompanySchema,
  sirenSchema,
  type SireneCompany,
  type LookupSireneInput,
  type SireneApiResponse,
} from "@/lib/schemas/sirene";

function handleDbError(operationLabel: string, error: unknown): ActionFailure {
  switch (prismaErrorCode(error)) {
    case PRISMA_UNIQUE_VIOLATION:
      return failure("Une entreprise avec ce SIREN existe déjà.");
    case PRISMA_FOREIGN_KEY_VIOLATION:
      return failure(`${operationLabel} : l'entité associée n'existe pas.`);
    case PRISMA_RECORD_NOT_FOUND:
      return failure(`${operationLabel} : élément introuvable.`);
    default:
      logger.error("actions/sirene", operationLabel, error);
      return failure(
        `${operationLabel} : une erreur interne est survenue. Réessayez plus tard.`
      );
  }
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const ETALAB_SEARCH_URL = "https://recherche-entreprises.api.gouv.fr/search";

const FETCH_TIMEOUT_MS = 8000;
const FETCH_RETRIES = 2;

async function fetchWithResilience(
  url: string,
  init: RequestInit = {}
): Promise<Response | null> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= FETCH_RETRIES; attempt++) {
    if (attempt > 0) {
      // Exponential backoff with jitter — runs for EVERY retry path
      // (network errors, timeouts, 5xx and 429 alike).
      const backoff = 300 * 2 ** (attempt - 1) + Math.floor(Math.random() * 150);
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      // Retry only on transient upstream errors, not on 4xx client errors.
      if (response.status >= 500 || response.status === 429) {
        lastError = new Error(`upstream ${response.status}`);
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timer);
    }
  }

  console.warn("[Sirene] fetch exhausted retries:", lastError);
  return null;
}

function isCacheFresh(fetchedAt: Date): boolean {
  return Date.now() - fetchedAt.getTime() < CACHE_TTL_MS;
}

interface EtalabResult {
  siren?: string;
  nom_complet?: string;
  denomination?: string;
  categorie_juridique?: string;
  activite_principale?: string;
  siege?: {
    siret?: string;
    numero_voie?: string;
    type_voie?: string;
    libelle_voie?: string;
    code_postal?: string;
    libelle_commune?: string;
    activite_principale?: string;
  };
}

function mapEtalabResult(result: EtalabResult): SireneApiResponse | null {
  const siren = result.siren;
  if (!siren) return null;

  const siege = result.siege ?? {};
  const addressParts = [
    siege.numero_voie,
    siege.type_voie,
    siege.libelle_voie,
  ].filter((part): part is string => Boolean(part && part.trim().length > 0));

  return {
    siren,
    nic: siege.siret ? siege.siret.slice(-5) : undefined,
    denomination:
      result.denomination ?? result.nom_complet ?? `Entreprise ${siren}`,
    legalForm: result.categorie_juridique,
    activityCode: result.activite_principale ?? siege.activite_principale,
    address: addressParts.length > 0 ? addressParts.join(" ") : undefined,
    postalCode: siege.code_postal,
    city: siege.libelle_commune,
  };
}

type EtalabOutcome =
  | { status: "found"; data: SireneApiResponse }
  | { status: "not-found" }
  | { status: "upstream-down" };

async function fetchFromEtalab(siren: string): Promise<EtalabOutcome> {
  try {
    const response = await fetchWithResilience(
      `${ETALAB_SEARCH_URL}?q=${encodeURIComponent(siren)}&page=1&per_page=1`,
      { headers: { Accept: "application/json" }, next: { revalidate: 3600 } }
    );

    if (!response || !response.ok) {
      console.warn(`[Sirene] ETALAB API error: ${response?.status ?? "no response"}`);
      return { status: "upstream-down" };
    }

    const data = (await response.json()) as { results?: EtalabResult[] };
    const first = data.results?.[0];
    // Réponse 200 sans résultat = entreprise inexistante (définitif,
    // pas un problème d'upstream) — le fallback offline est interdit ici.
    if (!first) return { status: "not-found" };

    const mapped = mapEtalabResult(first);
    return mapped ? { status: "found", data: mapped } : { status: "not-found" };
  } catch (error) {
    console.warn("[Sirene] ETALAB fetch failed:", error);
    return { status: "upstream-down" };
  }
}

async function fetchFromInseeApi(siren: string): Promise<SireneApiResponse | null> {
  try {
    const token = process.env.INSEE_API_TOKEN;
    if (!token) return null;

    const response = await fetchWithResilience(
      `https://api.insee.fr/entreprises/sirene/V3/siren/${siren}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        next: { revalidate: 3600 },
      }
    );

    if (!response || !response.ok) {
      if (response?.status === 404) return null;
      console.warn(`[Sirene] INSEE API error: ${response?.status ?? "no response"}`);
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

function buildOfflineFallback(siren: string): SireneApiResponse | null {
  // Explicit opt-in anywhere, or automatic convenience outside production
  // (dev/tests must stay deterministic and network-free). Production always
  // requires a factual registry answer — never a placeholder.
  const mockMode = process.env.SIRENE_MOCK;
  const allowed =
    mockMode === "1" ||
    (mockMode !== "0" && process.env.NODE_ENV !== "production");
  if (!allowed) return null;
  return {
    siren,
    nic: "00001",
    denomination: `[HORS-LIGNE] Entreprise ${siren.slice(-3)}`,
    legalForm: "INCONNU",
    activityCode: undefined,
    address: undefined,
    postalCode: undefined,
    city: undefined,
  };
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
    let upstreamDown = false;

    const etalab = await fetchFromEtalab(siren);
    if (etalab.status === "found") {
      apiResponse = etalab.data;
    } else if (etalab.status === "upstream-down") {
      upstreamDown = true;
      const insee = await fetchFromInseeApi(siren);
      if (insee) {
        apiResponse = insee;
        upstreamDown = false;
      }
    } else {
      return failure(
        "Aucune entreprise trouvée dans le registre Sirene pour ce SIREN."
      );
    }

    if (!apiResponse) {
      if (!upstreamDown) {
        return failure(
          "Entreprise introuvable dans le registre Sirene (recherche-entreprises.api.gouv.fr)."
        );
      }
      apiResponse = buildOfflineFallback(siren);
    }

    if (!apiResponse) {
      return failure(
        "Registre Sirene momentanément indisponible. Réessayez dans quelques instants."
      );
    }

    // Offline fallbacks are returned but NEVER persisted, whatever the
    // environment or SIRENE_MOCK — caching a placeholder would poison the
    // SireneCompany table as "fresh" for the whole cache TTL.
    if (apiResponse.denomination.startsWith("[HORS-LIGNE]")) {
      return {
        success: true,
        data: {
          id: `offline-${siren}`,
          ...apiResponse,
          fetchedAt: new Date(),
        } as SireneCompany,
      };
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

export async function listCachedSireneCompanies(limit = 12): Promise<
  ActionResult<SireneCompany[]>
> {
  try {
    const companies = await prisma.sireneCompany.findMany({
      orderBy: { fetchedAt: "desc" },
      take: limit,
    });
    return { success: true, data: companies };
  } catch (error) {
    return handleDbError("La liste des entreprises Sirene", error);
  }
}
