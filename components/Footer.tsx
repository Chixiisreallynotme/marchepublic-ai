import Link from "next/link";
import { Scale, HeartHandshake, ShieldCheck, Activity } from "lucide-react";
import { HealthStatus } from "./HealthStatus";

const LEGAL_LINKS = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Politique de confidentialité" },
  { href: "/cgu", label: "Conditions générales d'utilisation" },
  { href: "/accessibilite", label: "Accessibilité : partiellement conforme" },
] as const;

function RepubliqueBadge() {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="h-10 w-7 shrink-0 overflow-hidden rounded-sm border border-border shadow-card"
      >
        <span className="flex h-full w-full flex-col">
          <span className="h-1/3 w-full bg-[#000091]" />
          <span className="h-1/3 w-full bg-white" />
          <span className="h-1/3 w-full bg-[#e1000f]" />
        </span>
      </span>
      <div className="leading-tight">
        <p className="text-sm font-bold tracking-wide uppercase">République Française</p>
        <p className="text-xs text-muted-foreground">Liberté · Égalité · Fraternité</p>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-50 dark:bg-surface-950">
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="space-y-4">
            <RepubliqueBadge />
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
              <p>
                MarchéPublic.ai accompagne les entreprises dans la réponse aux marchés publics :
                appels d&apos;offres, mémoires techniques et documents CERFA.
              </p>
            </div>
          </div>

          <nav aria-label="Liens légaux">
            <h2 className="mb-3 text-sm font-semibold">Informations légales</h2>
            <ul className="space-y-2">
              {LEGAL_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground transition-colors hover:text-brand-600"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Activity className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              État des services
            </h2>
            {/* États réels servis par GET /api/health (base de données, registre Sirene,
                générateur CERFA) — rafraîchis toutes les 5 minutes. */}
            <HealthStatus />
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
              Données hébergées en France — RGPD
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Scale className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
            © {new Date().getFullYear()} MarchéPublic.ai — Tous droits réservés.
          </p>
          <p className="text-xs text-muted-foreground">
            Plateforme indépendante, non affiliée à l&apos;État français.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
