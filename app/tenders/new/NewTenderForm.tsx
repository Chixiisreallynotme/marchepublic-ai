"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileUp, Loader2, Plus, X } from "lucide-react";
import { createTender } from "@/lib/actions/tenders";
import type { FieldIssues } from "@/lib/actions/tenders";
import {
  PROCEDURE_TYPES,
  TENDER_STATUSES,
} from "@/lib/schemas/tender";

const PROCEDURE_LABELS: Record<string, string> = {
  APPEL_OFFRES_OUVERT: "Appel d'offres ouvert",
  APPEL_OFFRES_RESTREINT: "Appel d'offres restreint",
  PROCEDURE_ADAPTEE: "Procédure adaptée",
  PROCEDURE_NEGOCIEE: "Procédure négociée",
  DIALOGUE_COMPETITIF: "Dialogue compétitif",
  CONCOURS: "Concours",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  IN_PROGRESS: "En cours",
  CLOSED: "Clôturé",
  AWARDED: "Attribué",
};

function FieldError({ issues, name }: { issues?: FieldIssues; name: string }) {
  const list = issues?.[name];
  if (!list?.length) return null;
  return (
    <p className="mt-1.5 text-xs text-red-600 dark:text-red-400" role="alert">
      {list.join(" ")}
    </p>
  );
}

export function NewTenderForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<FieldIssues | undefined>();
  const [dceUrl, setDceUrl] = useState<string | null>(null);
  const [dceName, setDceName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de l'envoi du DCE.");
      setDceUrl(data.url);
      setDceName(data.name ?? file.name);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    setIssues(undefined);

    const estimatedRaw = String(formData.get("estimatedValue") ?? "").replace(/\s/g, "").replace(",", ".");
    const payload = {
      title: formData.get("title"),
      reference: formData.get("reference"),
      description: formData.get("description"),
      buyerName: formData.get("buyerName"),
      procedureType: formData.get("procedureType"),
      status: formData.get("status"),
      cpvCode: formData.get("cpvCode"),
      deadline: formData.get("deadline") || undefined,
      publicationDate: formData.get("publicationDate") || undefined,
      estimatedValue: estimatedRaw ? Number(estimatedRaw) : undefined,
      dceUrl: dceUrl ?? undefined,
      organizationId,
    };

    const result = await createTender(payload);
    if (result.success) {
      router.push(`/tenders/${result.data.id}`);
      return;
    }
    setError(result.error);
    setIssues(result.issues);
    setSubmitting(false);
  }

  return (
    <div className="container-page py-10">
      <Link
        href="/tenders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour au tableau de bord
      </Link>

      <header className="mt-4 mb-8 max-w-2xl">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Nouvel appel d&apos;offres
        </h1>
        <p className="mt-2 text-muted-foreground">
          Renseignez les métadonnées du DCE pour centraliser le suivi et préparer votre mémoire technique.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(new FormData(e.currentTarget));
        }}
        className="grid gap-6 lg:grid-cols-3"
        noValidate
      >
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Identification
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-sm font-medium">Intitulé *</span>
                <input name="title" required minLength={3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  placeholder="Rénovation énergétique du groupe scolaire…" />
                <FieldError issues={issues} name="title" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Référence *</span>
                <input name="reference" required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  placeholder="AO-2025-001245" />
                <FieldError issues={issues} name="reference" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Acheteur public</span>
                <input name="buyerName"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  placeholder="Ville de Lyon — Direction des bâtiments" />
                <FieldError issues={issues} name="buyerName" />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Cadre du marché
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Type de procédure</span>
                <select name="procedureType" defaultValue="APPEL_OFFRES_OUVERT"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30">
                  {PROCEDURE_TYPES.map((t) => (
                    <option key={t} value={t}>{PROCEDURE_LABELS[t]}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Statut</span>
                <select name="status" defaultValue="PUBLISHED"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30">
                  {TENDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Code CPV</span>
                <input name="cpvCode"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  placeholder="45261210-9" />
                <FieldError issues={issues} name="cpvCode" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Valeur estimée (€ HT)</span>
                <input name="estimatedValue" inputMode="decimal"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  placeholder="850000" />
                <FieldError issues={issues} name="estimatedValue" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Date de publication</span>
                <input type="date" name="publicationDate"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Date limite de remise</span>
                <input type="date" name="deadline"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
                <FieldError issues={issues} name="deadline" />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-sm font-medium">Description</span>
                <textarea name="description" rows={5}
                  className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  placeholder="Objet du marché, lots, contraintes de site, normes applicables…" />
              </label>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <FileUp className="h-4 w-4" aria-hidden="true" />
              Pièce DCE
            </h2>
            {dceUrl ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-900/20">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{dceName}</p>
                  <a href={dceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-700 underline dark:text-emerald-400">
                    Voir le fichier
                  </a>
                </div>
                <button type="button" onClick={() => { setDceUrl(null); setDceName(null); }}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                  aria-label="Retirer le fichier">
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <label
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${uploading ? "border-brand-300 bg-brand-50/50 dark:bg-brand-900/10" : "border-border hover:border-brand-400 hover:bg-muted/50"}`}
              >
                <input type="file" accept=".pdf,.zip,.rar,.7z,application/pdf,application/zip"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleUpload(file);
                  }} />
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-brand-500" aria-hidden="true" />
                ) : (
                  <>
                    <FileUp className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm font-medium">Déposer le DCE</span>
                    <span className="text-xs text-muted-foreground">PDF ou archive · 25 Mo max</span>
                  </>
                )}
              </label>
            )}
            {uploadError && (
              <p className="mt-2 text-xs text-red-600" role="alert">{uploadError}</p>
            )}
          </section>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-900/20 dark:text-red-200" role="alert">
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting || uploading} className="btn-primary w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            {submitting ? "Création…" : "Créer l'appel d'offres"}
          </button>
        </aside>
      </form>
    </div>
  );
}
