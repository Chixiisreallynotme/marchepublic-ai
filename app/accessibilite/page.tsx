import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Accessibilité" };

export default function AccessibilitePage() {
  return (
    <LegalPage title="Déclaration d'accessibilité" updated="août 2026">
      <h2>Conformité</h2>
      <p>
        MarchéPublic.ai vise la conformité avec les critères WCAG 2.1 niveau AA. L&apos;interface
        est partiellement conforme : certains contenus tiers ou cas limites peuvent ne pas encore
        satisfaire l&apos;intégralité des critères.
      </p>

      <h2>Dispositions mises en œuvre</h2>
      <ul>
        <li>Navigation au clavier et anneaux de focus visibles sur tous les éléments interactifs.</li>
        <li>Structure sémantique (landmarks, titres hiérarchisés, listes).</li>
        <li>Étiquettes de formulaires associées, états d&apos;erreur annoncés (role=&quot;alert&quot;).</li>
        <li>Respect de prefers-reduced-motion pour toutes les animations.</li>
        <li>Contrastes de texte conformes AA sur les couleurs principales.</li>
      </ul>

      <h2>Signaler un problème</h2>
      <p>
        Si vous rencontrez un obstacle, signalez-le à l&apos;exploitant de l&apos;instance afin
        qu&apos;il soit corrigé.
      </p>
    </LegalPage>
  );
}
