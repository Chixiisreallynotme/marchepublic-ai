import { Gavel, FileText, Euro, TrendingUp } from "lucide-react";
import { cn, formatAmount } from "@/lib/utils";
import type { TenderWithCounts } from "@/lib/actions/tenders";

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
      value: formatAmount(totalValue),
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