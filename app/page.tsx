import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  ArrowRight,
  Gavel,
  FileText,
  FileCheck2,
  Building2,
  Sparkles,
  ShieldCheck,
  Zap,
  Plus,
} from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";

async function getLiveStats() {
  try {
    const [tenders, criteria, documents] = await Promise.all([
      prisma.tender.count(),
      prisma.criterion.count(),
      prisma.cerfaDocument.count(),
    ]);
    return { tenders, criteria, documents };
  } catch {
    return { tenders: 0, criteria: 0, documents: 0 };
  }
}

const FEATURES = [
  {
    href: "/tenders",
    icon: Gavel,
    title: "Appels d'offres",
    description:
      "Centralisez chaque consultation : échéances, lots, statuts et pièces du DCE dans un tableau de bord unique.",
    span: "lg:col-span-2 lg:row-span-1",
    accent: "from-brand-500/10 to-transparent",
  },
  {
    href: "/memories",
    icon: FileText,
    title: "Mémoires Techniques",
    description:
      "Rédigez critère par critère, avec suivi pondéré de l'avancement.",
    span: "",
    accent: "",
  },
  {
    href: "/cerfa",
    icon: FileCheck2,
    title: "Documents CERFA",
    description:
      "DC1 / DC2 en PDF pré-remplis depuis vos données d'entreprise.",
    span: "",
    accent: "",
  },
  {
    href: "/sirene",
    icon: Building2,
    title: "Open Data Sirene",
    description:
      "Identité, forme juridique et adresse vérifiées via le registre officiel.",
    span: "",
    accent: "",
  },
  {
    href: "/simulation",
    icon: Sparkles,
    title: "Simulation de score",
    description:
      "Estimez votre note pondérée avant l'envoi et identifiez les angles morts de votre réponse — scoring local, analyse IA optionnelle.",
    span: "lg:col-span-2",
    accent: "from-brand-500/10 to-transparent",
  },
] as const;

export default async function HomePage() {
  const stats = await getLiveStats();

  function HeroBadge() {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-card">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
        Conforme au Code de la commande publique
      </span>
    );
  }

  const STATS = [
    { value: String(stats.tenders), label: "appels d'offres suivis" },
    { value: String(stats.criteria), label: "critères analysés" },
    { value: String(stats.documents), label: "documents générés" },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(61,103,242,0.12),transparent)]"
        />
        <div className="container-page flex flex-col items-center py-24 text-center sm:py-32">
          <Reveal>
            <HeroBadge />
          </Reveal>

          <Reveal delay={100}>
            <h1 className="mt-8 max-w-4xl text-balance font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              L&apos;IA qui répond à vos{" "}
              <span className="text-gradient">marchés publics</span>
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="mt-6 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground">
              MarchéPublic.ai structure vos appels d&apos;offres, rédige vos mémoires techniques
              critère par critère et génère vos documents CERFA — pour soumissionner plus vite,
              sans rien oublier.
            </p>
          </Reveal>

          <Reveal delay={300} className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/tenders/new" className="btn-primary">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Créer un appel d&apos;offres
            </Link>
            <Link href="/simulation" className="btn-secondary">
              <Zap className="h-4 w-4 text-brand-500" aria-hidden="true" />
              Voir la simulation de score
            </Link>
          </Reveal>

          <Reveal delay={400}>
            <dl className="mt-16 grid w-full max-w-2xl grid-cols-3 gap-4">
              {STATS.map(({ value, label }) => (
                <div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-6">
                  <dt className="order-last mt-2 text-xs text-muted-foreground">{label}</dt>
                  <dd className="font-display text-4xl font-bold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-muted-foreground/70">Données réelles de la plateforme</p>
          </Reveal>
        </div>
      </section>

      {/* Features — gapless bento */}
      <section
        className="container-page pb-24"
        aria-label="Fonctionnalités de la plateforme"
      >
        <Reveal>
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
            <ul className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ href, icon: Icon, title, description, span, accent }, i) => (
                <li key={href} className={cn("bg-card", span)}>
                  <Link
                    href={href}
                    className={cn(
                      "group relative flex h-full flex-col overflow-hidden p-7 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500",
                      i === 0 && "sm:col-span-2 lg:row-span-1"
                    )}
                  >
                    {accent && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100",
                          accent
                        )}
                      />
                    )}
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-all duration-300 group-hover:scale-105 group-hover:bg-brand-600 group-hover:text-white dark:bg-surface-800">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 font-display text-xl font-semibold tracking-tight">{title}</h3>
                    <p className={cn("mt-2 text-sm leading-relaxed text-muted-foreground", !accent && "")}>
                      {description}
                    </p>
                    <ArrowRight
                      className="mt-auto pt-4 h-4 w-4 self-end text-brand-500 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Plateforme indépendante · Données hébergées en France ·{" "}
            <Link href="/mentions-legales" className="underline decoration-border underline-offset-4 transition-colors hover:text-brand-600">
              Mentions légales
            </Link>
          </p>
        </Reveal>
      </section>
    </div>
  );
}
