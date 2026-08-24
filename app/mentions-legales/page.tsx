import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Mentions légales" };

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales" updated="août 2026">
      <h2>Éditeur</h2>
      <p>
        MarchéPublic.ai est une plateforme indépendante d&apos;assistance à la réponse aux marchés
        publics français. Elle n&apos;est affiliée ni à l&apos;État français, ni à un quelconque
        service public. Les informations légales complètes de l&apos;éditeur (dénomination, SIREN,
        adresse, hébergeur) sont à compléter par l&apos;exploitant de l&apos;instance.
      </p>

      <h2>Objet</h2>
      <p>
        La plateforme aide les soumissionnaires à structurer leurs appels d&apos;offres, rédiger
        leurs mémoires techniques et produire des formulaires CERFA (DC1, DC2) pré-remplis.
      </p>

      <h2>Responsabilité</h2>
      <ul>
        <li>
          Les documents générés sont des projets de candidatures : ils restent sous la seule
          responsabilité du candidat qui les signe et les transmet.
        </li>
        <li>
          Les données d&apos;entreprise proviennent du registre officiel
          recherche-entreprises.api.gouv.fr (Insee) ; leur exactitude n&apos;est pas garantie par la
          plateforme.
        </li>
      </ul>

      <h2>Contact</h2>
      <p>Coordonnées de contact de l&apos;exploitant à renseigner ici.</p>
    </LegalPage>
  );
}
