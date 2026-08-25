import { z } from "zod";

export const CERFA_FORM_TYPES = [
  "DC1",
  "DC2",
  "DC4",
  "NOTI2",
] as const;

export type CerfaFormType = (typeof CERFA_FORM_TYPES)[number];

export const cerfaFormTypeSchema = z.enum(CERFA_FORM_TYPES);

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

const addressSchema = z.object({
  address: optionalText("Adresse", 255),
  postalCode: z.preprocess(
    emptyToUndefined,
    z
      .string({ invalid_type_error: "Le code postal doit être une chaîne de caractères." })
      .trim()
      .regex(/^\d{5}$/, "Le code postal doit contenir 5 chiffres.")
      .optional()
  ),
  city: optionalText("Ville", 100),
});

const companySchema = z.object({
  denomination: requiredText("Dénomination sociale", 2),
  siren: z.preprocess(
    emptyToUndefined,
    z
      .string({ invalid_type_error: "Le SIREN doit être une chaîne de caractères." })
      .trim()
      .regex(/^\d{9}$/, "Le SIREN doit contenir 9 chiffres.")
      .optional()
  ),
  siret: z.preprocess(
    emptyToUndefined,
    z
      .string({ invalid_type_error: "Le SIRET doit être une chaîne de caractères." })
      .trim()
      .regex(/^\d{14}$/, "Le SIRET doit contenir 14 chiffres.")
      .optional()
  ),
  legalForm: optionalText("Forme juridique", 100),
  activityCode: optionalText("Code activité (APE/NAF)", 20),
  ...addressSchema.shape,
  email: z.preprocess(
    emptyToUndefined,
    z
      .string({ invalid_type_error: "L'email doit être une chaîne de caractères." })
      .trim()
      .email("Format d'email invalide.")
      .optional()
  ),
  phone: optionalText("Téléphone", 20),
});

export const dc1Schema = z.object({
  formType: z.literal("DC1"),
  tenderReference: requiredText("Référence de l'appel d'offres"),
  buyerName: requiredText("Nom de l'acheteur public"),
  buyerAddress: addressSchema,
  candidate: companySchema.extend({
    isGroup: z.boolean().default(false),
    groupMembers: z
      .array(
        z.object({
          denomination: requiredText("Dénomination membre", 2),
          siren: z
            .string()
            .trim()
            .regex(/^\d{9}$/, "SIREN invalide (9 chiffres)"),
          legalForm: optionalText("Forme juridique", 100),
          ...addressSchema.shape,
        })
      )
      .optional(),
  }),
  representative: z
    .object({
      firstName: requiredText("Prénom", 1),
      lastName: requiredText("Nom", 1),
      role: requiredText("Qualité", 1),
      email: z.preprocess(
        emptyToUndefined,
        z.string().email("Format d'email invalide.").optional()
      ),
      phone: optionalText("Téléphone", 20),
    })
    .optional(),
  signatory: z.object({
    firstName: requiredText("Prénom du signataire", 1),
    lastName: requiredText("Nom du signataire", 1),
    role: requiredText("Qualité du signataire", 1),
  }),
  declarationDate: z.preprocess(
    emptyToUndefined,
    z.coerce.date({ invalid_type_error: "Date de déclaration invalide." }).optional()
  ),
});

export const dc2Schema = z.object({
  formType: z.literal("DC2"),
  tenderReference: requiredText("Référence de l'appel d'offres"),
  buyerName: requiredText("Nom de l'acheteur public"),
  candidate: companySchema.extend({
    isGroup: z.boolean().default(false),
    groupLeadSiren: z
      .string()
      .trim()
      .regex(/^\d{9}$/, "SIREN mandataire invalide (9 chiffres)")
      .optional(),
  }),
  capacity: z
    .object({
      legal: z
        .array(
          z.object({
            description: requiredText("Description capacité juridique"),
            evidence: optionalText("Justificatif", 1000),
          })
        )
        .optional(),
      technical: z
        .array(
          z.object({
            description: requiredText("Description capacité technique"),
            evidence: optionalText("Justificatif", 1000),
          })
        )
        .optional(),
      financial: z
        .array(
          z.object({
            description: requiredText("Description capacité financière"),
            evidence: optionalText("Justificatif", 1000),
          })
        )
        .optional(),
      turnoverHistory: optionalText("Historique du chiffre d'affaires", 5000),
      workforceHistory: optionalText("Historique des effectifs", 5000),
      references: optionalText("Références", 5000),
    })
    .optional(),
  signatory: z.object({
    firstName: requiredText("Prénom du signataire", 1),
    lastName: requiredText("Nom du signataire", 1),
    role: requiredText("Qualité du signataire", 1),
  }),
  declarationDate: z.preprocess(
    emptyToUndefined,
    z.coerce.date({ invalid_type_error: "Date de déclaration invalide." }).optional()
  ),
});

export const dc4Schema = z.object({
  formType: z.literal("DC4"),
  tenderReference: requiredText("Référence de l'appel d'offres"),
  buyerName: requiredText("Nom de l'acheteur public"),
  buyerAddress: addressSchema,
  subcontractor: companySchema.extend({
    mainContractorSiren: z
      .string()
      .trim()
      .regex(/^\d{9}$/, "SIREN titulaire principal invalide (9 chiffres)"),
    contractDescription: requiredText("Description du lot sous-traité"),
    contractValue: z
      .number({ invalid_type_error: "Le montant doit être un nombre." })
      .nonnegative("Le montant ne peut pas être négatif.")
      .optional(),
  }),
  signatory: z.object({
    firstName: requiredText("Prénom du signataire", 1),
    lastName: requiredText("Nom du signataire", 1),
    role: requiredText("Qualité du signataire", 1),
  }),
  declarationDate: z.preprocess(
    emptyToUndefined,
    z.coerce.date({ invalid_type_error: "Date de déclaration invalide." }).optional()
  ),
});

export const noti2Schema = z.object({
  formType: z.literal("NOTI2"),
  tenderReference: requiredText("Référence de l'appel d'offres"),
  buyerName: requiredText("Nom de l'acheteur public"),
  buyerAddress: addressSchema,
  candidate: companySchema,
  documents: z
    .array(
      z.object({
        type: requiredText("Type de document"),
        description: optionalText("Description", 500),
        reference: optionalText("Référence", 100),
        fileUrl: optionalText("URL du fichier", 500),
      })
    )
    .min(1, "Au moins un document est requis."),
  signatory: z.object({
    firstName: requiredText("Prénom du signataire", 1),
    lastName: requiredText("Nom du signataire", 1),
    role: requiredText("Qualité du signataire", 1),
  }),
  declarationDate: z.preprocess(
    emptyToUndefined,
    z.coerce.date({ invalid_type_error: "Date de déclaration invalide." }).optional()
  ),
});

export const cerfaDocumentSchema = z.discriminatedUnion("formType", [
  dc1Schema,
  dc2Schema,
  dc4Schema,
  noti2Schema,
]);

export type DC1Input = z.infer<typeof dc1Schema>;
export type DC2Input = z.infer<typeof dc2Schema>;
export type DC4Input = z.infer<typeof dc4Schema>;
export type NOTI2Input = z.infer<typeof noti2Schema>;
export type CerfaDocumentInput = z.infer<typeof cerfaDocumentSchema>;

export const generateCerfaSchema = z.object({
  tenderId: z.string({ required_error: "L'identifiant de l'appel d'offres est requis." }).min(1, "L'identifiant de l'appel d'offres est requis."),
  memoryId: z.string({ required_error: "L'identifiant du mémoire technique est requis." }).min(1, "L'identifiant du mémoire technique est requis."),
  formType: cerfaFormTypeSchema,
  payload: cerfaDocumentSchema,
});

export type GenerateCerfaInput = z.infer<typeof generateCerfaSchema>;