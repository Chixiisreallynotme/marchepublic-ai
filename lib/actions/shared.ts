/**
 * Primitives partagées de toutes les Server Actions (pattern ActionResult).
 * Toute action renvoie { success, data } ou { success, error, issues } —
 * jamais d'exception traversante vers le client.
 *
 * @domain tenders, memories, cerfa, sirene
 */
import type { z } from "zod";

export type FieldIssues = Record<string, string[]>;

export type ActionResult<TData> =
  | { success: true; data: TData }
  | { success: false; error: string; issues?: FieldIssues };

export type ActionFailure = { success: false; error: string; issues?: FieldIssues };

export const PRISMA_UNIQUE_VIOLATION = "P2002";
export const PRISMA_FOREIGN_KEY_VIOLATION = "P2003";
export const PRISMA_RECORD_NOT_FOUND = "P2025";

export function prismaErrorCode(error: unknown): string | null {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  return null;
}

export function validationFailure(error: z.ZodError): ActionFailure {
  return {
    success: false,
    error: "Les données soumises sont invalides.",
    issues: fieldIssuesFromZodError(error),
  };
}

export function fieldIssuesFromZodError(error: z.ZodError): FieldIssues {
  const issues: FieldIssues = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.map(String).join(".") : "_form";
    (issues[key] ??= []).push(issue.message);
  }
  return issues;
}

export function failure(error: string): ActionFailure {
  return { success: false, error };
}
