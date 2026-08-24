import type { ReactNode } from "react";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <div className="container-page max-w-3xl py-12">
      <header className="mb-10">
        <h1 className="font-display text-4xl font-bold tracking-tight">{title}</h1>
        {updated && (
          <p className="mt-2 text-sm text-muted-foreground">Dernière mise à jour : {updated}</p>
        )}
      </header>
      <div className="space-y-6 text-[15px] leading-relaxed text-foreground/90 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:pt-4 [&_li]:ml-5 [&_li]:list-disc [&_p]:text-muted-foreground [&_ul]:space-y-1.5">
        {children}
      </div>
    </div>
  );
}
