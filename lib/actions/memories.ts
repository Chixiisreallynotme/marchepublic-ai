"use server";

import { z } from "zod";
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

import type {
  Criterion,
  MemorySection,
  TechnicalMemory,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getActiveOrganization } from "@/lib/org";
import {
  createMemorySchema,
  createSectionSchema,
  memoryStatusSchema,
  reorderSectionsSchema,
  updateMemorySchema,
  updateSectionSchema,
} from "@/lib/schemas/memory";

export type TechnicalMemoryWithRelations = TechnicalMemory & {
  tender: {
    id: string;
    title: string;
    criteria: Criterion[];
  };
  sections: (MemorySection & { criterion: Criterion | null })[];
};

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

    const activeOrg = await getActiveOrganization();
    if (memory.organizationId !== activeOrg.id) {
      return failure("Ce mémoire technique n'appartient pas à votre organisation.");
    }

    if (criterionId) {
      const criterion = await prisma.criterion.findUnique({
        where: { id: criterionId },
        select: { tenderId: true },
      });
      if (!criterion) {
        return failure("Critère introuvable.");
      }
      if (criterion.tenderId !== memory.tenderId) {
        return failure("Ce critère n'appartient pas à cet appel d'offres.");
      }
    }

    const wordCount = countWords(content);
    const sectionId = parsed.data.id;

    if (sectionId) {
      const existing = await prisma.memorySection.findUnique({
        where: { id: sectionId },
        select: { memoryId: true },
      });
      if (!existing || existing.memoryId !== memoryId) {
        return failure("Section introuvable dans ce mémoire technique.");
      }
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
    }

    // Never trust client-supplied ids on create: let Prisma generate the PK.
    const { id: _ignored, ...createRest } = rest;
    const created = await prisma.memorySection.create({
      data: {
        ...createRest,
        content,
        wordCount,
        memoryId,
        criterionId: criterionId ?? null,
      },
    });
    return { success: true, data: created };
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

    if (sections.length > 50) {
      return failure("Trop de sections à réorganiser (50 maximum).");
    }

    const sectionIds = sections.map((s) => s.id);
    const existingSections = await prisma.memorySection.findMany({
      where: { id: { in: sectionIds } },
      select: { id: true, memoryId: true },
    });

    if (existingSections.length !== sections.length) {
      return failure("Une ou plusieurs sections sont introuvables.");
    }

    // Anti cross-memory reorder: every section must belong to one memory.
    const memoryIds = new Set(existingSections.map((s) => s.memoryId));
    if (memoryIds.size !== 1) {
      return failure("Les sections doivent appartenir au même mémoire technique.");
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

export type MemoryOverviewItem = {
  id: string;
  title: string;
  status: string;
  updatedAt: Date;
  tenderId: string;
  tenderTitle: string;
  criteriaCount: number;
  sectionsDone: number;
  totalWeightedProgress: number;
};

export async function listMemories(): Promise<ActionResult<MemoryOverviewItem[]>> {
  try {
    // 3 requêtes groupées, progression pondérée EXACTE (poids des critères
    // réellement complétés), pagination bornée.
    const [memories, criteriaGroups] = await Promise.all([
      prisma.technicalMemory.findMany({
        orderBy: { updatedAt: "desc" },
        take: 200,
        include: { tender: { select: { id: true, title: true } } },
      }),
      prisma.criterion.groupBy({
        by: ["tenderId"],
        _count: { _all: true },
        _sum: { weight: true },
      }),
    ]);

    const completedWeightByMemory = new Map<string, number>();
    const completedCriteriaByMemory = new Map<string, Set<string>>();
    const sectionRows = await prisma.memorySection.findMany({
      where: { wordCount: { gt: 0 }, criterionId: { not: null } },
      select: { memoryId: true, criterionId: true, criterion: { select: { weight: true } } },
    });
    for (const row of sectionRows) {
      if (!row.criterion) continue;
      completedWeightByMemory.set(
        row.memoryId,
        (completedWeightByMemory.get(row.memoryId) ?? 0) + row.criterion.weight
      );
      const set = completedCriteriaByMemory.get(row.memoryId) ?? new Set<string>();
      set.add(row.criterionId as string);
      completedCriteriaByMemory.set(row.memoryId, set);
    }

    const criteriaByTender = new Map(
      criteriaGroups.map((g) => [
        g.tenderId,
        { count: g._count._all, weight: g._sum.weight ?? 0 },
      ])
    );

    const items = memories.map((memory) => {
      const criteria = criteriaByTender.get(memory.tenderId);
      const criteriaCount = criteria?.count ?? 0;
      const totalWeight = criteria?.weight ?? 0;
      const doneWeight = completedWeightByMemory.get(memory.id) ?? 0;
      return {
        id: memory.id,
        title: memory.title,
        status: memory.status,
        updatedAt: memory.updatedAt,
        tenderId: memory.tender.id,
        tenderTitle: memory.tender.title,
        criteriaCount,
        sectionsDone: completedCriteriaByMemory.get(memory.id)?.size ?? 0,
        totalWeightedProgress:
          totalWeight > 0
            ? Math.min(100, Math.round((doneWeight / totalWeight) * 100))
            : 0,
      };
    });

    return { success: true, data: items };
  } catch (error) {
    return handleDbError("La liste des mémoires techniques", error);
  }
}

export type MemoryStatusValue = z.infer<typeof memoryStatusSchema>;

export async function updateMemoryStatus(
  memoryId: string,
  status: MemoryStatusValue
): Promise<ActionResult<TechnicalMemory>> {
  try {
    if (!memoryId || memoryId.trim().length === 0) {
      return failure("L'identifiant du mémoire technique est requis.");
    }

    const parsed = updateMemorySchema.safeParse({ status });
    if (!parsed.success) {
      return validationFailure(parsed.error);
    }

    const existing = await prisma.technicalMemory.findUnique({
      where: { id: memoryId },
      select: { organizationId: true },
    });
    if (!existing) {
      return failure("Mémoire technique introuvable.");
    }
    const activeOrg = await getActiveOrganization();
    if (existing.organizationId !== activeOrg.id) {
      return failure("Ce mémoire technique n'appartient pas à votre organisation.");
    }

    const updated = await prisma.technicalMemory.update({
      where: { id: memoryId },
      data: { status: parsed.data.status },
    });

    return { success: true, data: updated };
  } catch (error) {
    return handleDbError("La mise à jour du statut du mémoire", error);
  }
}