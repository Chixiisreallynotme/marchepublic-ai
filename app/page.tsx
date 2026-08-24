import Link from "next/link";
import {
  ArrowRight,
  Gavel,
  FileText,
  FileCheck2,
  Building2,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    href: "/tenders",
    icon: Gavel,
    title: "Appels d'offres",
    description:
      "Centralisez et suivez chaque appel d'offres : échéances, lots, statuts et pièces du DCE en un seul tableau de bord.",
  },
  {
    href: "/memories",
    icon: FileText,
    title: "Mémoires Techniques",
    description:
      "Rédigez section par section un mémoire technique qui répond point par point aux critères de sélection de l'acheteur.",
  },
  {
    href: "/cerfa",
    icon: FileCheck2,
    title: "Documents CERFA",
    description:
      "Générez automatiquement les formulaires administratifs (DC1, DC2…) pré-remplis depuis vos données d'entreprise.",
  },
  {
    href: "/sirene",
    icon: Building2,
    title: "Open Data Sirene",
    description:
      "Enrichissez vos réponses avec les données officielles du registre Sirene : identité, forme juridique, adresse.",
  },
  {
    href: "/simulation",
    icon: Sparkles,
    title: "Simulation",
    description:
      "Estimez votre score avant l'envoi grâce à une simulation pondérée des critères d'évaluation du jury.",
  },
] as const;

const STATS = [
  { value: "×3", label: "temps gagné sur la rédaction" },
  { value: "+250", label: "critères analysés par mémoire" },
  { value: "100 %", label: "formulaires CERFA pré-remplis" },
] as const;

function HeroBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-card">
      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
      Conforme au Code de la commande publique
    </span>
  );
}

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(61,103,242,0.12),transparent)]"
        />
        <div className="container-page flex flex-col items-center py-24 text-center sm:py-32">
          <div className="animate-fade-up">
            <HeroBadge />
          </div>

          <h1
            className="animate-fade-up mt-8 max-w-3xl text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
            style={{ animationDelay: "100ms" }}
          >
            L&apos;IA qui répond à vos <span className="text-gradient">marchés publics</span>
          </h1>

          <p
            className="animate-fade-up mt-6 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground"
            style={{ animationDelay: "200ms" }}
          >
            MarchéPublic.ai structure vos appels d&apos;offres, rédige vos mémoires techniques
            critère par critère et génère vos documents CERFA — pour soumissionner plus vite,
            sans rien oublier.
          </p>

          <div
            className="animate-fade-up mt-10 flex flex-col gap-3 sm:flex-row"
            style={{ animationDelay: "300ms" }}
          >
            <Link href="/tenders" className="btn-primary">
              Commencer gratuitement
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/simulation" className="btn-secondary">
              <Zap className="h-4 w-4 text-brand-500" aria-hidden="true" />
              Voir la simulation de score
            </Link>
          </div>

          <dl
            className="animate-fade-up mt-16 grid w-full max-w-2xl grid-cols-3 gap-4"
            style={{ animationDelay: "400ms" }}
          >
            {STATS.map(({ value, label }) => (
              <div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-6">
                <dt className="order-last mt-2 text-xs text-muted-foreground">{label}</dt>
                <dd className="text-2xl font-extrabold text-gradient sm:text-3xl">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Features */}
      <section
        className="container-page pb-24"
        aria-labelledby="features-title"
        aria-label="Fonctionnalités de la plateforme"
      >
        <h2 id="features-title" className="sr-only">
          Fonctionnalités de la plateforme
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ href, icon: Icon, title, description }, i) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card transition-all",
                "hover:-translate-y-1 hover:border-brand-300 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                // last card spans the full row on large screens for balance
                i === FEATURES.length - 1 && "sm:col-span-2 lg:col-span-1"
              )}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white dark:bg-surface-800">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
              <ArrowRight
                className="absolute right-5 top-6 h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-brand-600 group-hover:opacity-100"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
