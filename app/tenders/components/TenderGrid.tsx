"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { TenderCard } from "./TenderCard";
import { EmptyState } from "./EmptyState";
import type { TenderWithCounts } from "@/lib/actions/tenders";

type FilterValue = "ALL" | "OPEN" | "IN_PROGRESS" | "CLOSED";

const FILTERS: { value: FilterValue; label: string; match: (t: TenderWithCounts) => boolean }[] = [
  {
    value: "ALL",
    label: "Tous",
    match: () => true,
  },
  {
    value: "OPEN",
    label: "Ouverts / Brouillons",
    match: (t) => t.status === "PUBLISHED" || t.status === "DRAFT",
  },
  {
    value: "IN_PROGRESS",
    label: "En cours",
    match: (t) => t.status === "IN_PROGRESS",
  },
  {
    value: "CLOSED",
    label: "Clôturés / Attribués",
    match: (t) => t.status === "CLOSED" || t.status === "AWARDED",
  },
];

export function TenderGrid({ tenders }: { tenders: TenderWithCounts[] }) {
  const [filter, setFilter] = useState<FilterValue>("ALL");

  const active = FILTERS.find((f) => f.value === filter) ?? FILTERS[0];
  const filtered = useMemo(() => tenders.filter(active.match), [tenders, active]);

  return (
    <div>
      <div
        className="mb-5 inline-flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1 shadow-card"
        role="tablist"
        aria-label="Filtrer par statut"
      >
        {FILTERS.map((f) => {
          const count = tenders.filter(f.match).length;
          return (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === f.value
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {f.label}
              <span
                className={cn(
                  "ml-1.5 tabular-nums text-xs",
                  filter === f.value ? "text-white/80" : "text-muted-foreground/70"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {tenders.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="font-semibold">Aucun appel d&apos;offres dans ce filtre</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Statuts concernés : {active.label.toLowerCase()}.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(380px,1fr))]">
          {filtered.map((tender) => (
            <TenderCard key={tender.id} tender={tender} />
          ))}
        </div>
      )}
    </div>
  );
}