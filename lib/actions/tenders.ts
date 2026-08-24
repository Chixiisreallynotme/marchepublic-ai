"use server";

import { z } from "zod";
import type { Criterion, Organization, Tender } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createCriterionSchema,
  createTenderSchema,
  updateCriterionSchema,
  updateTenderSchema,
} from "@/lib/schemas/tender";

export type FieldIssues = Record<string, string[]>;

export type ActionResult<TData> =
  | { success: true; data: TData }
  | { success: false; error: string; issues?: FieldIssues };

type ActionFailure = { success: false; error: string; issues?: FieldIssues };

export type TenderWithCounts = Tender & {
  organization: Organization;
  _count: { criteria: number };
};

export type TenderWithRelations = Tender & {
  organization: Organization;
  criteria: Criterion[];
};

const PRISMA_UNIQUE_VIOLATION = "P2002";
const PRISMA_FOREIGN_KEY_VIOLATION = "P2003";
const PRISMA_RECORD_NOT_FOUND = "P2025";

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
      return failure("Un appel d'offres avec cette référence existe déjà.");
    case PRISMA_FOREIGN_KEY_VIOLATION:
      return failure(`${operationLabel} : l'entité associée n'existe pas.`);
    case PRISMA_RECORD_NOT_FOUND:
      return failure(`${operationLabel} : élément introuvable.`);
    default:
      console.error(`[actions/tenders] ${operationLabel}`, error);
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
