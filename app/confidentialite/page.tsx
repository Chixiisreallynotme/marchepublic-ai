import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Politique de confidentialité" };

export default function ConfidentialitePage() {
  return (
    <LegalPage title="Politique de confidentialité" updated="août 2026">
      <h2>Données traitées</h2>
      <ul>
        <li>Données de vos appels d&apos;offres (titres, références, montants, échéances).</li>
        <li>Contenu de vos mémoires techniques et documents CERFA.</li>
        <li>
          Données d&apos;entreprise issues du registre Sirene, mises en cache locale pour
          performance.
        </li>
      </ul>

      <h2>Hébergement</h2>
      <p>
        Les données sont stockées dans une base SQLite locale à l&apos;instance. Aucune donnée
        n&apos;est revendue ni transmise à des tiers à des fins publicitaires.
      </p>

      <h2>Tiers</h2>
      <ul>
        <li>
          <strong>Sirene / ETALAB</strong> : requêtes vers
          recherche-entreprises.api.gouv.fr limitées au SIREN recherché.
        </li>
        <li>
          <strong>Analyse IA (optionnelle)</strong> : si vous configurez une clé LLM_API_KEY, les
          résumés de sections peuvent être transmis au fournisseur choisi. Sans clé, aucune donnée
          ne quitte l&apos;instance pour l&apos;analyse.
        </li>
      </ul>

      <h2>Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification et
        d&apos;effacement sur vos données. Sur une instance auto-hébergée, exercez ces droits
        directement auprès de son exploitant ou via la base de données.
      </p>
    </LegalPage>
  );
}
