"use client";

import Link from "next/link";
import { useState } from "react";
import { Gavel, FileText, FileCheck2, Building2, Sparkles, Menu, X, ArrowRight, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV_LINKS = [
  { href: "/tenders", label: "Appels d'offres", icon: Gavel },
  { href: "/memories", label: "Mémoires Techniques", icon: FileText },
  { href: "/cerfa", label: "CERFA", icon: FileCheck2 },
  { href: "/sirene", label: "Open Data Sirene", icon: Building2 },
  { href: "/simulation", label: "Simulation", icon: Sparkles },
] as const;

function BrandMark() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="MarchéPublic.ai — Accueil">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-glow">
        <Scale className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="text-lg font-bold tracking-tight">
        Marché<span className="text-gradient">Public</span>
        <span className="text-brand-600">.ai</span>
      </span>
    </Link>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <nav className="container-page flex h-16 items-center justify-between" aria-label="Navigation principale">
        <BrandMark />

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors",
                  "hover:bg-muted hover:text-foreground"
                )}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden lg:block">
          <Link href="/tenders" className="btn-primary !py-2">
            Démarrer maintenant
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground lg:hidden"
        >
          {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </nav>

      <div id="mobile-menu" hidden={!open} className="border-t border-border lg:hidden">
        <div className="container-page space-y-1 py-4">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Icon className="h-4 w-4 text-brand-500" aria-hidden="true" />
              {label}
            </Link>
          ))}
          <Link href="/tenders" onClick={() => setOpen(false)} className="btn-primary mt-3 w-full">
            Démarrer maintenant
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
