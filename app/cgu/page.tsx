import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Conditions générales d'utilisation" };

export default function CguPage() {
  return (
    <LegalPage title="Conditions générales d'utilisation" updated="août 2026">
      <h2>1. Acceptation</h2>
      <p>
        L&apos;utilisation de MarchéPublic.ai implique l&apos;acceptation des présentes conditions.
        Elles peuvent être mises à jour ; la version applicable est celle affichée sur cette page.
      </p>

      <h2>2. Usage de la plateforme</h2>
      <ul>
        <li>La plateforme est fournie en l&apos;état, sans garantie de disponibilité continue.</li>
        <li>L&apos;utilisateur est responsable de la véracité des informations qu&apos;il saisit.</li>
        <li>
          Les documents générés (CERFA, mémoires) sont des brouillons à relire avant toute
          transmission officielle.
        </li>
      </ul>

      <h2>3. Limitation de responsabilité</h2>
      <p>
        La plateforme ne saurait être tenue responsable d&apos;une perte de chance, d&apos;un
        rejet de candidature ou de tout dommage indirect lié à l&apos;usage des documents produits.
      </p>

      <h2>4. Propriété</h2>
      <p>
        L&apos;utilisateur conserve l&apos;intégralité des droits sur ses contenus. La marque et le
        code source de la plateforme restent la propriété de leur auteur.
      </p>
    </LegalPage>
  );
}
