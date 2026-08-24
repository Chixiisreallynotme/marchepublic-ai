import Link from "next/link";
import {
  Gavel,
  Building2,
  Tag,
  Calendar,
  Euro,
  TrendingUp,
  Plus,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { cn, formatAmount, formatDate, getDaysRemaining, getDeadlineBadgeClass, STATUS_LABELS, PROCEDURE_LABELS } from "@/lib/utils";
import type { TenderWithCounts } from "@/lib/actions/tenders";

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  DRAFT: Clock,
  PUBLISHED: AlertTriangle,
  IN_PROGRESS: CheckCircle2,
  CLOSED: Gavel,
  AWARDED: TrendingUp,
};

export function TenderCard({
  tender,
}: {
  tender: TenderWithCounts;
}) {
  const daysRemaining = getDaysRemaining(tender.deadline);
  const criteriaCount = tender._count?.criteria ?? 0;

  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-lg hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-foreground truncate">{tender.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              <Tag className="h-3 w-3 mr-1" aria-hidden="true" />
              {tender.reference}
            </span>
            <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {PROCEDURE_LABELS[tender.procedureType] ?? tender.procedureType}
            </span>
          </div>
        </div>
        <span
          className={cn(
            "flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
            getDeadlineBadgeClass(daysRemaining)
          )}
        >
          {daysRemaining === null
            ? "Pas de date"
            : daysRemaining < 0
            ? `Expiré (${Math.abs(daysRemaining)}j)`
            : daysRemaining === 0
            ? "Aujourd'hui"
            : `${daysRemaining}j`}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Building2 className="h-4 w-4" aria-hidden="true" />
          {tender.buyerName ?? "Acheteur non défini"}
        </span>
        {tender.cpvCode && (
          <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-mono">
            CPV {tender.cpvCode}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-baseline gap-1">
          <Euro className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <span className="text-xl font-bold text-foreground">{formatAmount(tender.estimatedValue)}</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" aria-hidden="true" />
            {criteriaCount} critère{criteriaCount > 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            Mémoire: {criteriaCount > 0 ? "En cours" : "Non commencé"}
          </span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <Link
          href={`/tenders/${tender.id}`}
          className="btn-primary w-full justify-center"
        >
          Consulter le dossier
          <Gavel className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}