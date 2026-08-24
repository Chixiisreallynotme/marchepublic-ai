"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileCheck2, Loader2, Sparkles } from "lucide-react";
import { generateCerfaPrefilled } from "@/lib/actions/cerfa";

const FORMS = [
  {
    value: "DC1" as const,
    label: "DC1 — Lettre de candidature",
    hint: "Cerfa 11197*05 · identification du candidat et du groupement",
  },
  {
    value: "DC2" as const,
    label: "DC2 — Déclaration du candidat",
    hint: "Cerfa 11207*08 · capacités juridiques, techniques et financières",
  },
];

export function CerfaGenerator({
  tenderId,
  memoryId,
}: {
  tenderId: string;
  memoryId?: string;
}) {
  const router = useRouter();
  const [formType, setFormType] = useState<"DC1" | "DC2">("DC1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const disabled = !memoryId;

  async function handleGenerate() {
    if (!memoryId) return;
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await generateCerfaPrefilled(tenderId, memoryId, formType);
      if (!result.success) {
        throw new Error(result.error);
      }
      setSuccess(`${result.data.formNumber} généré — pré-rempli depuis vos données d'entreprise.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <FileCheck2 className="h-5 w-5 text-brand-500" aria-hidden="true" />
        Générateur CERFA
      </h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Pré-remplit les formulaires administratifs depuis votre fiche Sirene et votre organisation.
      </p>

      <fieldset className="mt-5 space-y-2" disabled={disabled}>
        <legend className="sr-only">Type de formulaire</legend>
        {FORMS.map((form) => (
          <label
            key={form.value}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
              formType === form.value
                ? "border-brand-400 bg-brand-50/60 ring-1 ring-brand-300 dark:bg-brand-900/20"
                : "border-border hover:border-brand-300 hover:bg-muted/40"
            }`}
          >
            <input
              type="radio"
              name="cerfa-form"
              value={form.value}
              checked={formType === form.value}
              onChange={() => setFormType(form.value)}
              className="mt-0.5 h-4 w-4 accent-brand-600"
            />
            <span>
              <span className="block text-sm font-semibold">{form.label}</span>
              <span className="block text-xs text-muted-foreground">{form.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {disabled && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
          Créez un mémoire technique pour cet appel d&apos;offres avant de générer un document.
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300" role="status">
          {success}
        </p>
      )}

      <button
        type="button"
        onClick={handleGenerate}
        disabled={busy || disabled}
        className="btn-primary mt-5 w-full"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        )}
        {busy ? "Génération…" : `Générer le ${formType}`}
      </button>
    </div>
  );
}
