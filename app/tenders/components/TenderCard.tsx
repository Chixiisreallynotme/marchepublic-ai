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
import { cn } from "@/lib/utils";
import type { TenderWithCounts } from "@/lib/actions/tenders";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  IN_PROGRESS: "En cours",
  CLOSED: "Clôturé",
  AWARDED: "Attribué",
};

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  DRAFT: Clock,
  PUBLISHED: AlertTriangle,
  IN_PROGRESS: CheckCircle2,
  CLOSED: Gavel,
  AWARDED: TrendingUp,
};

const PROCEDURE_LABELS: Record<string, string> = {
  APPEL_OFFRES_OUVERT: "Appel d'offres ouvert",
  APPEL_OFFRES_RESTREINT: "Appel d'offres restreint",
  PROCEDURE_ADAPTEE: "Procédure adaptée",
  PROCEDURE_NEGOCIEE: "Procédure négociée",
  DIALOGUE_COMPETITIF: "Dialogue compétitif",
  CONCOURS: "Concours",
};

function formatEUR(value: number | null | undefined): string {
  if (!value) return "Non défini";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "Non définie";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function getDaysRemaining(deadline: Date | null | undefined): number | null {
  if (!deadline) return null;
  const now = new Date();
  const diff = new Date(deadline).getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getDeadlineBadgeClass(days: number | null): string {
  if (days === null) return "bg-muted text-muted-foreground";
  if (days < 0) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (days <= 7) return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
  if (days <= 30) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
}

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
          <span className="text-xl font-bold text-foreground">{formatEUR(tender.estimatedValue)}</span>
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