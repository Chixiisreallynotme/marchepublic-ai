import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim().length === 0) return undefined;
  if (value === null) return undefined;
  return value;
};

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

function requiredText(label: string, minLength = 1) {
  return z
    .string({
      required_error: `${label} est obligatoire.`,
      invalid_type_error: `${label} doit être une chaîne de caractères.`,
    })
    .trim()
    .min(minLength, `${label} doit contenir au moins ${minLength} caractère${minLength > 1 ? "s" : ""}.`);
}

export const sirenSchema = z
  .string({
    required_error: "Le SIREN est obligatoire.",
    invalid_type_error: "Le SIREN doit être une chaîne de caractères.",
  })
  .trim()
  .regex(/^\d{9}$/, "Le SIREN doit contenir exactement 9 chiffres.")
  .transform((val) => val.replace(/\s/g, ""));

export const siretSchema = z
  .string({
    required_error: "Le SIRET est obligatoire.",
    invalid_type_error: "Le SIRET doit être une chaîne de caractères.",
  })
  .trim()
  .regex(/^\d{14}$/, "Le SIRET doit contenir exactement 14 chiffres.")
  .transform((val) => val.replace(/\s/g, ""));

export const sireneCompanySchema = z.object({
  id: z.string().optional(),
  siren: sirenSchema,
  nic: z
    .string({ invalid_type_error: "Le NIC doit être une chaîne de caractères." })
    .trim()
    .regex(/^\d{5}$/, "Le NIC doit contenir 5 chiffres.")
    .nullable()
    .optional(),
  denomination: requiredText("Dénomination sociale", 2),
  legalForm: z.string().nullable().optional(),
  activityCode: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  postalCode: z
    .string({ invalid_type_error: "Le code postal doit être une chaîne de caractères." })
    .trim()
    .regex(/^\d{5}$/, "Le code postal doit contenir 5 chiffres.")
    .nullable()
    .optional(),
  city: z.string().nullable().optional(),
  fetchedAt: z.preprocess(
    emptyToUndefined,
    z.coerce.date({ invalid_type_error: "Date de récupération invalide." }).optional()
  ),
});

export type SireneCompany = z.infer<typeof sireneCompanySchema>;
export type SirenInput = z.infer<typeof sirenSchema>;
export type SiretInput = z.infer<typeof siretSchema>;

export const lookupSireneSchema = z.object({
  siren: sirenSchema,
});

export type LookupSireneInput = z.infer<typeof lookupSireneSchema>;

export const sireneApiResponseSchema = z.object({
  siren: z.string().regex(/^\d{9}$/),
  nic: z.string().regex(/^\d{5}$/).optional(),
  denomination: z.string().min(1),
  legalForm: z.string().optional(),
  activityCode: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().regex(/^\d{5}$/).optional(),
  city: z.string().optional(),
});

export type SireneApiResponse = z.infer<typeof sireneApiResponseSchema>;