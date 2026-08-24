import { Gavel, Building2, Tag, Calendar, Euro, TrendingUp, Plus, FileText, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
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

export function StatsCards({ tenders }: { tenders?: TenderWithCounts[] }) {
  const total = tenders?.length ?? 0;
  const inProgress = tenders?.filter((t) => t.status === "IN_PROGRESS" || t.status === "DRAFT").length ?? 0;
  const totalValue = tenders?.reduce((sum, t) => sum + (t.estimatedValue ?? 0), 0) ?? 0;
  const successRate = total > 0
    ? Math.round((tenders?.filter((t) => t.status === "AWARDED").length ?? 0) / total * 100)
    : 0;

  const stats = [
    {
      label: "Total d'appels d'offres",
      value: total.toString(),
      icon: Gavel,
      color: "text-brand-600 bg-brand-50 dark:bg-brand-900/30",
    },
    {
      label: "En cours de rédaction",
      value: inProgress.toString(),
      icon: FileText,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30",
    },
    {
      label: "Montant total estimé",
      value: formatEUR(totalValue),
      icon: Euro,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30",
    },
    {
      label: "Taux de succès estimé",
      value: `${successRate}%`,
      icon: TrendingUp,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-900/30",
    },
  ];

  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Statistiques des appels d'offres">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <div className="flex items-center justify-between">
            <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
            <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", color)}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
          </div>
          <dd className="mt-4 text-3xl font-extrabold text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}