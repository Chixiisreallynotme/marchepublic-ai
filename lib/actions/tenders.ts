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

import type { Criterion, Organization, Tender } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createCriterionSchema,
  createTenderSchema,
  updateCriterionSchema,
  updateTenderSchema,
} from "@/lib/schemas/tender";

export type TenderWithCounts = Tender & {
  organization: Organization;
  _count: { criteria: number };
};

export type TenderWithRelations = Tender & {
  organization: Organization;
  criteria: Criterion[];
};

function handleDbError(operationLabel: string, error: unknown): ActionFailure {
  switch (prismaErrorCode(error)) {
    case PRISMA_UNIQUE_VIOLATION:
      return failure("Un appel d'offres avec cette référence existe déjà.");
    case PRISMA_FOREIGN_KEY_VIOLATION:
      return failure(`${operationLabel} : l'entité associée n'existe pas.`);
    case PRISMA_RECORD_NOT_FOUND:
      return failure(`${operationLabel} : élément introuvable.`);
    default:
      logger.error("actions/tenders", operationLabel, error);
      return failure(
        `${operationLabel} : une erreur interne est survenue. Réessayez plus tard.`
      );
  }
}

export async function getTenders(
  organizationId?: string
): Promise<ActionResult<TenderWithCounts[]>> {
  try {
    const tenders = await prisma.tender.findMany({
      where: organizationId ? { organizationId } : undefined,
      orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
      take: 200,
      include: {
        organization: true,
        _count: { select: { criteria: true } },
      },
    });
    return { success: true, data: tenders };
  } catch (error) {
    return handleDbError("Le chargement des appels d'offres", error);
  }
}

export async function getTenderById(id: string): Promise<ActionResult<TenderWithRelations>> {
  try {
    if (!id || id.trim().length === 0) {
      return failure("L'identifiant de l'appel d'offres est requis.");
    }
    const tender = await prisma.tender.findUnique({
      where: { id },
      include: {
        organization: true,
        criteria: { orderBy: { order: "asc" } },
      },
    });
    if (!tender) {
      return failure("Appel d'offres introuvable.");
    }
    return { success: true, data: tender };
  } catch (error) {
    return handleDbError("Le chargement de l'appel d'offres", error);
  }
}

export async function createTender(input: unknown): Promise<ActionResult<Tender>> {
  try {
    const parsed = createTenderSchema.safeParse(input);
    if (!parsed.success) {
      return validationFailure(parsed.error);
    }
    const created = await prisma.tender.create({ data: parsed.data });
    return { success: true, data: created };
  } catch (error) {
    return handleDbError("La création de l'appel d'offres", error);
  }
}

export async function updateTender(id: string, input: unknown): Promise<ActionResult<Tender>> {
  try {
    if (!id || id.trim().length === 0) {
      return failure("L'identifiant de l'appel d'offres est requis.");
    }
    const parsed = updateTenderSchema.safeParse(input);
    if (!parsed.success) {
      return validationFailure(parsed.error);
    }
    if (Object.keys(parsed.data).length === 0) {
      return failure("Aucune donnée à mettre à jour.");
    }
    const updated = await prisma.tender.update({
      where: { id },
      data: parsed.data,
    });
    return { success: true, data: updated };
  } catch (error) {
    return handleDbError("La mise à jour de l'appel d'offres", error);
  }
}

export async function deleteTender(id: string): Promise<ActionResult<Tender>> {
  try {
    if (!id || id.trim().length === 0) {
      return failure("L'identifiant de l'appel d'offres est requis.");
    }
    const deleted = await prisma.tender.delete({ where: { id } });
    return { success: true, data: deleted };
  } catch (error) {
    return handleDbError("La suppression de l'appel d'offres", error);
  }
}

const DEFAULT_CRITERIA = [
  { title: "Valeur technique de l'offre", weight: 40, description: "Qualité méthodologique, moyens humains et matériels, références pertinentes." },
  { title: "Prix des prestations", weight: 30, description: "Cohérence et compétitivité de l'offre financière." },
  { title: "Délais d'exécution", weight: 20, description: "Réalisme du planning et des phasages proposés." },
  { title: "Démarche environnementale et RSE", weight: 10, description: "Insertion, déchets, bilan carbone, matériaux durables." },
] as const;

export async function createDefaultCriteria(
  tenderId: string
): Promise<ActionResult<Criterion[]>> {
  try {
    if (!tenderId || tenderId.trim().length === 0) {
      return failure("L'identifiant de l'appel d'offres est requis.");
    }

    const tender = await prisma.tender.findUnique({
      where: { id: tenderId },
      select: { id: true, organizationId: true },
    });
    if (!tender) {
      return failure("Appel d'offres introuvable.");
    }
    const { getActiveOrganization } = await import("@/lib/org");
    const activeOrg = await getActiveOrganization();
    if (tender.organizationId !== activeOrg.id) {
      return failure("Cet appel d'offres n'appartient pas à votre organisation.");
    }

    const existingCount = await prisma.criterion.count({ where: { tenderId } });
    if (existingCount > 0) {
      return failure("Des critères existent déjà pour cet appel d'offres.");
    }

    const created = await prisma.$transaction(
      DEFAULT_CRITERIA.map((c, index) =>
        prisma.criterion.create({
          data: { tenderId, title: c.title, weight: c.weight, description: c.description, order: index + 1 },
        })
      )
    );
    return { success: true, data: created };
  } catch (error) {
    return handleDbError("La création des critères types", error);
  }
}

export async function createCriterion(input: unknown): Promise<ActionResult<Criterion>> {
  try {
    const parsed = createCriterionSchema.safeParse(input);
    if (!parsed.success) {
      return validationFailure(parsed.error);
    }
    const created = await prisma.criterion.create({ data: parsed.data });
    return { success: true, data: created };
  } catch (error) {
    return handleDbError("La création du critère", error);
  }
}

export async function updateCriterion(
  id: string,
  input: unknown
): Promise<ActionResult<Criterion>> {
  try {
    if (!id || id.trim().length === 0) {
      return failure("L'identifiant du critère est requis.");
    }
    const parsed = updateCriterionSchema.safeParse(input);
    if (!parsed.success) {
      return validationFailure(parsed.error);
    }
    if (Object.keys(parsed.data).length === 0) {
      return failure("Aucune donnée à mettre à jour.");
    }
    const updated = await prisma.criterion.update({
      where: { id },
      data: parsed.data,
    });
    return { success: true, data: updated };
  } catch (error) {
    return handleDbError("La mise à jour du critère", error);
  }
}

export async function deleteCriterion(id: string): Promise<ActionResult<Criterion>> {
  try {
    if (!id || id.trim().length === 0) {
      return failure("L'identifiant du critère est requis.");
    }
    const deleted = await prisma.criterion.delete({ where: { id } });
    return { success: true, data: deleted };
  } catch (error) {
    return handleDbError("La suppression du critère", error);
  }
}
