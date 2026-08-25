"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, TrendingUp, Plus, Loader2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createCriterion, createDefaultCriteria } from "@/lib/actions/tenders";
import { CriterionCard } from "./CriterionCard";

function getTotalWeight(criteria: Array<{ weight: number }>): number {
  return criteria.reduce((sum, c) => sum + (c.weight ?? 0), 0);
}

interface CriterionInput {
  id: string;
  title: string;
  description?: string | null;
  weight: number;
  order: number;
  sections?: Array<{ id: string }>;
}

export function CriteriaSection({
  tenderId,
  criteria,
}: {
  tenderId: string;
  criteria: CriterionInput[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [weight, setWeight] = useState("20");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const totalWeight = getTotalWeight(criteria);

  async function insertDefault() {
    setBusy(true);
    setError(null);
    const result = await createDefaultCriteria(tenderId);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  async function submitCriterion(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await createCriterion({
      tenderId,
      title,
      weight: Number(weight.replace(",", ".")) || 0,
      description: description || undefined,
      order: criteria.length + 1,
    });
    setBusy(false);
    if (!result.success) {
      setError(Object.values(result.issues ?? {}).flat()[0] ?? result.error);
      return;
    }
    setTitle("");
    setWeight("20");
    setDescription("");
    setFormOpen(false);
    startTransition(() => router.refresh());
  }

  const addForm = formOpen ? (
    <form
      onSubmit={submitCriterion}
      className="rounded-xl border border-brand-200 bg-brand-50/40 p-4 dark:border-brand-900 dark:bg-brand-900/10"
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold">Nouveau critère</h4>
        <button
          type="button"
          onClick={() => setFormOpen(false)}
          className="rounded p-1 text-muted-foreground hover:bg-muted"
          aria-label="Fermer le formulaire"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
        <label className="block">
          <span className="mb-1 block text-xs font-medium">Intitulé *</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={3}
            placeholder="Qualité de la méthodologie…"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium">Poids (%)</span>
          <input
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            inputMode="decimal"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium">Description (optionnel)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Ce que l'acheteur évalue sur ce critère…"
            className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </label>
      </div>
      <button type="submit" disabled={busy} className="btn-primary mt-3 !py-2">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
        Ajouter le critère
      </button>
    </form>
  ) : null;

  if (!criteria || criteria.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border bg-card p-8 text-center">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-foreground">Aucun critère défini</h3>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Les critères structurent votre mémoire technique : une section par critère, pondérée selon le jury.
        </p>
        <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={insertDefault}
            disabled={busy || isPending}
            className="btn-primary"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
            Insérer des critères types
          </button>
          <button type="button" onClick={() => setFormOpen(true)} className="btn-secondary">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Ajouter manuellement
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
        {addForm && <div className="mt-5 text-left">{addForm}</div>}
      </div>
    );
  }

  return (
    <section aria-labelledby="criteria-heading">
      <div className="flex items-center justify-between mb-6">
        <h2 id="criteria-heading" className="text-lg font-bold text-foreground">
          Critères d&apos;évaluation
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-brand-600">
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
            <span>Total: {totalWeight}%</span>
            {totalWeight !== 100 && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs",
                  totalWeight > 100
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                )}
              >
                {totalWeight > 100 ? "Dépasse 100%" : "Incomplet"}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFormOpen((v) => !v)}
            className="btn-secondary !py-1.5 !px-3 text-xs"
            aria-expanded={formOpen}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Critère
          </button>
        </div>
      </div>

      {addForm && <div className="mb-5">{addForm}</div>}
      {error && <p className="mb-4 text-sm text-red-600" role="alert">{error}</p>}

      <div className="space-y-4" role="list" aria-label="Liste des critères d'évaluation">
        {criteria.map((criterion) => (
          <CriterionCard key={criterion.id} criterion={criterion} totalWeight={totalWeight} />
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-muted/50 p-4">
        <h3 className="font-medium text-foreground">Répartition des poids</h3>
        <div
          className="mt-3 h-3 w-full rounded-full bg-muted overflow-hidden"
          role="img"
          aria-label={`Répartition visuelle des poids totalisant ${totalWeight}%`}
        >
          {criteria.map((criterion, index) => {
            const percentage = totalWeight > 0 ? (criterion.weight / totalWeight) * 100 : 0;
            const hue = (index * 137.5) % 360;
            return (
              <div
                key={criterion.id}
                className="h-full float-left transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: `hsl(${hue}, 65%, 50%)`,
                }}
                title={`${criterion.title}: ${percentage.toFixed(1)}%`}
              />
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {criteria.map((criterion) => (
            <span key={criterion.id} className="flex items-center gap-1">
              <span
                className="h-2 w-2 rounded"
                style={{ backgroundColor: `hsl(${((criteria.indexOf(criterion) * 137.5) % 360)}, 65%, 50%)` }}
              />
              {criterion.title}: {totalWeight > 0 ? ((criterion.weight / totalWeight) * 100).toFixed(1) : "0"}%
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
