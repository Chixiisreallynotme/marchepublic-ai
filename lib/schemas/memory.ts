import { z } from "zod";

export const MEMORY_STATUSES = [
  "DRAFT",
  "IN_REVIEW",
  "SUBMITTED",
] as const;

export type MemoryStatus = (typeof MEMORY_STATUSES)[number];

export const memoryStatusSchema = z.enum(MEMORY_STATUSES);

const emptyToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim().length === 0) return undefined;
  if (value === null) return undefined;
  return value;
};

function requiredText(label: string, minLength = 1) {
  return z
    .string({
      required_error: `${label} est obligatoire.`,
      invalid_type_error: `${label} doit être une chaîne de caractères.`,
    })
    .trim()
    .min(
      minLength,
      `${label} doit contenir au moins ${minLength} caractère${minLength > 1 ? "s" : ""}.`
    );
}

function optionalText(label: string, maxLength = 10000) {
  return z.preprocess(
    emptyToUndefined,
    z
      .string({ invalid_type_error: `${label} doit être une chaîne de caractères.` })
      .trim()
      .max(maxLength, `${label} ne peut pas dépasser ${maxLength} caractères.`)
      .optional()
  );
}

const memoryCoreSchema = z.object({
  title: requiredText("Le titre du mémoire technique", 3),
  tenderId: requiredText("L'identifiant de l'appel d'offres"),
  organizationId: requiredText("L'identifiant de l'organisation"),
  status: memoryStatusSchema.default("DRAFT"),
  summary: optionalText("Le résumé du mémoire"),
});

export const createMemorySchema = memoryCoreSchema;

export const updateMemorySchema = memoryCoreSchema.partial();

const sectionCoreSchema = z.object({
  id: z.string({ invalid_type_error: "L'identifiant de la section doit être une chaîne de caractères." }).optional(),
  title: requiredText("Le titre de la section", 3),
  content: z
    .string({ invalid_type_error: "Le contenu doit être une chaîne de caractères." })
    .default(""),
  memoryId: requiredText("L'identifiant du mémoire technique"),
  criterionId: z
    .string({ invalid_type_error: "L'identifiant du critère doit être une chaîne de caractères." })
    .optional(),
  order: z
    .number({ invalid_type_error: "L'ordre doit être un nombre." })
    .int("L'ordre doit être un nombre entier.")
    .min(0, "L'ordre ne peut pas être négatif.")
    .default(0),
});

export const createSectionSchema = sectionCoreSchema;

export const updateSectionSchema = sectionCoreSchema.partial();

export const reorderSectionsSchema = z.object({
  sections: z.array(
    z.object({
      id: z.string({ required_error: "L'identifiant de la section est requis." }),
      order: z.number({ required_error: "L'ordre est requis." }).int().min(0),
    })
  ),
});

export type CreateMemoryInput = z.infer<typeof createMemorySchema>;
export type UpdateMemoryInput = z.infer<typeof updateMemorySchema>;
export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
export type ReorderSectionsInput = z.infer<typeof reorderSectionsSchema>;