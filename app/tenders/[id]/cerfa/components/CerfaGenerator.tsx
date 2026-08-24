"use client";

export function CerfaGenerator({
  tenderId,
  memoryId,
  onGenerate,
}: {
  tenderId: string;
  memoryId?: string;
  onGenerate?: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold mb-4 text-foreground">Générateur CERFA</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Générez automatiquement vos formulaires CERFA DC1, DC2, DC4 et NOTI2 pré-remplis.
      </p>
    </div>
  );
}