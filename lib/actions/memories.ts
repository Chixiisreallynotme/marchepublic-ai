"use server";

import { z } from "zod";
import type {
  Criterion,
  MemorySection,
  TechnicalMemory,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createMemorySchema,
  createSectionSchema,
  reorderSectionsSchema,
  updateMemorySchema,
  updateSectionSchema,
} from "@/lib/schemas/memory";

export type FieldIssues = Record<string, string[]>;

export type ActionResult<TData> =
  | { success: true; data: TData }
  | { success: false; error: string; issues?: FieldIssues };

type ActionFailure = { success: false; error: string; issues?: FieldIssues };

export type TechnicalMemoryWithRelations = TechnicalMemory & {
  tender: {
    id: string;
    title: string;
    criteria: Criterion[];
  };
  sections: (MemorySection & { criterion: Criterion | null })[];
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
      return failure("Un mémoire technique avec ce titre existe déjà.");
    case PRISMA_FOREIGN_KEY_VIOLATION:
      return failure(`${operationLabel} : l'entité associée n'existe pas.`);
    case PRISMA_RECORD_NOT_FOUND:
      return failure(`${operationLabel} : élément introuvable.`);
    default:
      console.error(`[actions/memories] ${operationLabel}`, error);
      return failure(
        `${operationLabel} : une erreur interne est survenue. Réessayez plus tard.`
      );
  }
}

function countWords(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  return text.trim().split(/\s+/).length;
}

export async function getMemoryByTenderId(
  tenderId: string,
  organizationId: string
): Promise<ActionResult<TechnicalMemoryWithRelations | null>> {
  try {
    if (!tenderId || tenderId.trim().length === 0) {
      return failure("L'identifiant de l'appel d'offres est requis.");
    }
    if (!organizationId || organizationId.trim().length === 0) {
      return failure("L'identifiant de l'organisation est requis.");
    }

    const memory = await prisma.technicalMemory.findFirst({
      where: { tenderId, organizationId },
      include: {
        tender: {
          include: { criteria: { orderBy: { order: "asc" } } },
        },
        sections: {
          include: { criterion: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!memory) {
      return { success: true, data: null };
    }

    return { success: true, data: memory };
  } catch (error) {
    return handleDbError("Le chargement du mémoire technique", error);
  }
}

export async function createOrUpdateMemorySection(
  input: unknown
): Promise<ActionResult<MemorySection>> {
  try {
    const parsed = createSectionSchema.safeParse(input);
    if (!parsed.success) {
      return validationFailure(parsed.error);
    }

    const { memoryId, criterionId, content, ...rest } = parsed.data;

    const memory = await prisma.technicalMemory.findUnique({
      where: { id: memoryId },
    });
    if (!memory) {
      return failure("Mémoire technique introuvable.");
    }

    if (criterionId) {
      const criterion = await prisma.criterion.findUnique({
        where: { id: criterionId },
      });
      if (!criterion) {
        return failure("Critère introuvable.");
      }
    }

    const wordCount = countWords(content);

    if ("id" in parsed.data && (parsed.data as any).id) {
      const sectionId = (parsed.data as any).id;
      const updated = await prisma.memorySection.update({
        where: { id: sectionId },
        data: {
          ...rest,
          content,
          wordCount,
          criterionId: criterionId ?? null,
        },
      });
      return { success: true, data: updated };
    } else {
      const created = await prisma.memorySection.create({
        data: {
          ...rest,
          content,
          wordCount,
          memoryId,
          criterionId: criterionId ?? null,
        },
      });
      return { success: true, data: created };
    }
  } catch (error) {
    return handleDbError("La création ou mise à jour de la section", error);
  }
}

export async function reorderSections(
  input: unknown
): Promise<ActionResult<MemorySection[]>> {
  try {
    const parsed = reorderSectionsSchema.safeParse(input);
    if (!parsed.success) {
      return validationFailure(parsed.error);
    }

    const { sections } = parsed.data;

    const sectionIds = sections.map((s) => s.id);
    const existingSections = await prisma.memorySection.findMany({
      where: { id: { in: sectionIds } },
    });

    if (existingSections.length !== sections.length) {
      return failure("Une ou plusieurs sections sont introuvables.");
    }

    const updatedSections = await prisma.$transaction(
      sections.map((s) =>
        prisma.memorySection.update({
          where: { id: s.id },
          data: { order: s.order },
        })
      )
    );

    return { success: true, data: updatedSections };
  } catch (error) {
    return handleDbError("La réorganisation des sections", error);
  }
}

export async function updateMemoryStatus(
  memoryId: string,
  status: "DRAFT" | "IN_REVIEW" | "SUBMITTED"
): Promise<ActionResult<TechnicalMemory>> {
  try {
    if (!memoryId || memoryId.trim().length === 0) {
      return failure("L'identifiant du mémoire technique est requis.");
    }

    const parsed = updateMemorySchema.safeParse({ status });
    if (!parsed.success) {
      return validationFailure(parsed.error);
    }

    const updated = await prisma.technicalMemory.update({
      where: { id: memoryId },
      data: { status: parsed.data.status! },
    });

    return { success: true, data: updated };
  } catch (error) {
    return handleDbError("La mise à jour du statut du mémoire", error);
  }
}