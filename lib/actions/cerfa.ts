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
  generateCerfaSchema,
  cerfaDocumentSchema,
  type GenerateCerfaInput,
  type CerfaDocumentInput,
} from "@/lib/schemas/cerfa";
import { buildPrefillPayload } from "@/lib/cerfa/prefill";

export type CerfaDocumentWithRelations = {
  id: string;
  formNumber: string;
  label: string | null;
  payload: string;
  fileUrl: string | null;
  createdAt: Date;
  memoryId: string;
};

function handleDbError(operationLabel: string, error: unknown): ActionFailure {
  switch (prismaErrorCode(error)) {
    case PRISMA_UNIQUE_VIOLATION:
      return failure("Un document CERFA avec ces informations existe déjà.");
    case PRISMA_FOREIGN_KEY_VIOLATION:
      return failure(`${operationLabel} : l'entité associée n'existe pas.`);
    case PRISMA_RECORD_NOT_FOUND:
      return failure(`${operationLabel} : élément introuvable.`);
    default:
      logger.error("actions/cerfa", operationLabel, error);
      return failure(
        `${operationLabel} : une erreur interne est survenue. Réessayez plus tard.`
      );
  }
}

export async function generateCerfa(input: GenerateCerfaInput): Promise<ActionResult<CerfaDocumentWithRelations>> {
  try {
    const parsed = generateCerfaSchema.safeParse(input);
    if (!parsed.success) {
      return validationFailure(parsed.error);
    }

    const { tenderId, memoryId, formType, payload } = parsed.data;

    const memory = await prisma.technicalMemory.findUnique({
      where: { id: memoryId },
      include: { tender: true },
    });

    if (!memory) {
      return failure("Mémoire technique introuvable.");
    }

    if (memory.tenderId !== tenderId) {
      return failure("Le mémoire technique n'appartient pas à cet appel d'offres.");
    }

    const cerfaDoc = cerfaDocumentSchema.parse(payload);

    const label = getFormLabel(formType);

    const created = await prisma.cerfaDocument.create({
      data: {
        formNumber: formType,
        label,
        payload: JSON.stringify(cerfaDoc),
        memoryId,
      },
    });

    return { success: true, data: created };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationFailure(error);
    }
    return handleDbError("La génération du document CERFA", error);
  }
}

export async function getCerfaDocuments(tenderId: string): Promise<ActionResult<CerfaDocumentWithRelations[]>> {
  try {
    if (!tenderId || tenderId.trim().length === 0) {
      return failure("L'identifiant de l'appel d'offres est requis.");
    }

    const documents = await prisma.cerfaDocument.findMany({
      where: {
        memory: {
          tenderId,
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        memory: {
          select: { id: true, tenderId: true },
        },
      },
    });

    return { success: true, data: documents };
  } catch (error) {
    return handleDbError("La récupération des documents CERFA", error);
  }
}

export async function getCerfaById(id: string): Promise<ActionResult<CerfaDocumentWithRelations | null>> {
  try {
    if (!id || id.trim().length === 0) {
      return failure("L'identifiant du document CERFA est requis.");
    }

    const document = await prisma.cerfaDocument.findUnique({
      where: { id },
      include: {
        memory: {
          select: { id: true, tenderId: true },
        },
      },
    });

    if (!document) {
      return { success: true, data: null };
    }

    return { success: true, data: document };
  } catch (error) {
    return handleDbError("La récupération du document CERFA", error);
  }
}

export async function generateCerfaPrefilled(
  tenderId: string,
  memoryId: string,
  formType: "DC1" | "DC2"
): Promise<ActionResult<CerfaDocumentWithRelations>> {
  try {
    if (!tenderId || !memoryId) {
      return failure("L'appel d'offres et le mémoire technique sont requis.");
    }

    const tender = await prisma.tender.findUnique({ where: { id: tenderId } });
    if (!tender) return failure("Appel d'offres introuvable.");

    const organization = await prisma.organization.findUnique({
      where: { id: tender.organizationId },
      include: { sireneCompany: true },
    });
    if (!organization) return failure("Organisation introuvable.");

    const payload = buildPrefillPayload({
      formType,
      tender,
      org: organization,
      sirene: organization.sireneCompany,
    });

    return generateCerfa({ tenderId, memoryId, formType, payload } satisfies GenerateCerfaInput);
  } catch (error) {
    return handleDbError("La génération pré-remplie du document CERFA", error);
  }
}

export type CerfaDocumentWithTender = CerfaDocumentWithRelations & {
  memory: { id: string; tenderId: string };
};

export async function listAllCerfaDocuments(): Promise<
  ActionResult<CerfaDocumentWithTender[]>
> {
  try {
    const documents = await prisma.cerfaDocument.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        memory: { select: { id: true, tenderId: true } },
      },
    });
    return { success: true, data: documents };
  } catch (error) {
    return handleDbError("La liste des documents CERFA", error);
  }
}

function getFormLabel(formType: string): string {
  switch (formType) {
    case "DC1":
      return "Lettre de candidature (DC1 - Cerfa 11197)";
    case "DC2":
      return "Déclaration du candidat (DC2 - Cerfa 11207)";
    case "DC4":
      return "Déclaration de sous-traitance (DC4 - Cerfa 11208)";
    case "NOTI2":
      return "Notification de candidature (NOTI2)";
    default:
      return `Formulaire CERFA ${formType}`;
  }
}