import { z } from "zod";

export const TENDER_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "IN_PROGRESS",
  "CLOSED",
  "AWARDED",
] as const;

export const PROCEDURE_TYPES = [
  "APPEL_OFFRES_OUVERT",
  "APPEL_OFFRES_RESTREINT",
  "PROCEDURE_ADAPTEE",
  "PROCEDURE_NEGOCIEE",
  "DIALOGUE_COMPETITIF",
  "CONCOURS",
] as const;

export type TenderStatus = (typeof TENDER_STATUSES)[number];
export type ProcedureType = (typeof PROCEDURE_TYPES)[number];

export const DEFAULT_TENDER_STATUS: TenderStatus = "DRAFT";
export const DEFAULT_PROCEDURE_TYPE: ProcedureType = "APPEL_OFFRES_OUVERT";
export const DEFAULT_CRITERION_WEIGHT = 1;

export const tenderStatusSchema = z.enum(TENDER_STATUSES);
export const procedureTypeSchema = z.enum(PROCEDURE_TYPES);

const CPV_CODE_REGEX = /^\d{8}-\d$/;

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

function optionalText(label: string, maxLength = 5000) {
  return z.preprocess(
    emptyToUndefined,
    z
      .string({ invalid_type_error: `${label} doit être une chaîne de caractères.` })
      .trim()
      .max(maxLength, `${label} ne peut pas dépasser ${maxLength} caractères.`)
      .optional()
  );
}

function optionalCpvCode() {
  return z.preprocess(
    emptyToUndefined,
    z
      .string({ invalid_type_error: "Le code CPV doit être une chaîne de caractères." })
      .trim()
      .regex(CPV_CODE_REGEX, "Code CPV invalide (format attendu : 45261210-9).")
      .optional()
  );
}

const tenderCoreSchema = z.object({
  title: requiredText("Le titre de l'appel d'offres", 3),
  reference: requiredText("La référence"),
  description: optionalText("La description"),
  buyerName: optionalText("Le nom de l'acheteur", 255),
  cpvCode: optionalCpvCode(),
  estimatedValue: z
    .number({ invalid_type_error: "La valeur estimée doit être un nombre." })
    .nonnegative("La valeur estimée ne peut pas être négative.")
    .optional(),
  procedureType: procedureTypeSchema,
  deadline: z.preprocess(
    emptyToUndefined,
    z.coerce.date({ invalid_type_error: "La date limite est invalide." }).optional()
  ),
  dceUrl: optionalText("L'URL du DCE", 500),
  organizationId: requiredText("L'identifiant de l'organisation"),
  status: tenderStatusSchema,
});

export const createTenderSchema = tenderCoreSchema.extend({
  procedureType: procedureTypeSchema.default(DEFAULT_PROCEDURE_TYPE),
  status: tenderStatusSchema.default(DEFAULT_TENDER_STATUS),
});

export const updateTenderSchema = tenderCoreSchema.partial();

const criterionCoreSchema = z.object({
  title: requiredText("Le titre du critère", 3),
  description: optionalText("La description du critère"),
  weight: z
    .number({ invalid_type_error: "La pondération doit être un nombre." })
    .min(0, "La pondération ne peut pas être inférieure à 0.")
    .max(100, "La pondération ne peut pas dépasser 100."),
  order: z
    .number({ invalid_type_error: "L'ordre doit être un nombre." })
    .int("L'ordre doit être un nombre entier.")
    .min(0, "L'ordre ne peut pas être négatif."),
  tenderId: requiredText("L'identifiant de l'appel d'offres"),
});

export const createCriterionSchema = criterionCoreSchema.extend({
  weight: z
    .number({ invalid_type_error: "La pondération doit être un nombre." })
    .min(0, "La pondération ne peut pas être inférieure à 0.")
    .max(100, "La pondération ne peut pas dépasser 100.")
    .default(DEFAULT_CRITERION_WEIGHT),
  order: z
    .number({ invalid_type_error: "L'ordre doit être un nombre." })
    .int("L'ordre doit être un nombre entier.")
    .min(0, "L'ordre ne peut pas être négatif.")
    .default(0),
});

export const updateCriterionSchema = criterionCoreSchema.partial();

export type CreateTenderInput = z.infer<typeof createTenderSchema>;
export type UpdateTenderInput = z.infer<typeof updateTenderSchema>;
export type CreateCriterionInput = z.infer<typeof createCriterionSchema>;
export type UpdateCriterionInput = z.infer<typeof updateCriterionSchema>;
