import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("[seed] Starting database seed...");

  // 1. Create Organization
  const organization = await prisma.organization.upsert({
    where: { id: "org-novatech-btp" },
    update: {},
    create: {
      id: "org-novatech-btp",
      name: "Novatech BTP SAS",
      role: "BIDDER",
      email: "contact@novatech-btp.fr",
      phone: "04 72 00 00 00",
      address: "42 Rue de la République",
      city: "Lyon",
      postalCode: "69002",
    },
  });
  console.log("[ok] Organization created:", organization.name);

  // 2. Create Tender
  const tender = await prisma.tender.upsert({
    where: { reference: "AO-2024-001245" },
    update: {},
    create: {
      id: "tender-renovation-scolaire-lyon",
      title: "Rénovation énergétique et isolation thermique du Groupe Scolaire Jean Moulin - Ville de Lyon",
      reference: "AO-2024-001245",
      description: `Travaux de rénovation énergétique et d'isolation thermique du Groupe Scolaire Jean Moulin situé à Lyon (69003). 
Le marché comprend :
- Isolation thermique par l'extérieur (ITE) des façades
- Remplacement des menuiseries extérieures par du double vitrage performant
- Isolation des toitures terrasses
- Mise en place d'une VMC double flux
- Travaux en site occupé (école en fonctionnement)
- Respect des normes RT2012 / RE2020
- Certification HQE visée`,
      status: "PUBLISHED",
      procedureType: "APPEL_OFFRES_OUVERT",
      cpvCode: "45261210-9",
      buyerName: "Ville de Lyon - Direction des Bâtiments Scolaires",
      estimatedValue: 850000,
      publicationDate: new Date("2024-01-15"),
      deadline: new Date("2024-03-15"),
      organizationId: organization.id,
    },
  });
  console.log("[ok] Tender created:", tender.title);

  // 3. Create 5 Criteria
  const criteriaData = [
    {
      id: "criterion-methodologie",
      title: "Méthodologie d'exécution",
      description: "Qualité et pertinence de la méthode proposée pour réaliser les travaux en site occupé, phasage, gestion des interfaces, protection des occupants.",
      weight: 40,
      order: 1,
    },
    {
      id: "criterion-moyens-humains",
      title: "Moyens humains et encadrement",
      description: "Qualification et expérience de l'équipe d'encadrement (conducteur de travaux, chef de chantier), effectifs prévus, plan de formation.",
      weight: 20,
      order: 2,
    },
    {
      id: "criterion-environnement",
      title: "Démarche environnementale et RSE",
      description: "Gestion des déchets, matériaux biosourcés/recyclés, bilan carbone, charte chantier bas carbone, insertion professionnelle.",
      weight: 15,
      order: 3,
    },
    {
      id: "criterion-planning",
      title: "Planning et phasage en site occupé",
      description: "Réalisme du planning, phasage par zones, coordination avec l'établissement scolaire, gestion des périodes de vacances scolaires.",
      weight: 15,
      order: 4,
    },
    {
      id: "criterion-prix",
      title: "Prix des prestations",
      description: "Cohérence et compétitivité de l'offre financière, décomposition par lot, justification des prix unitaires.",
      weight: 10,
      order: 5,
    },
  ];

  for (const criterion of criteriaData) {
    await prisma.criterion.upsert({
      where: { id: criterion.id },
      update: {},
      create: {
        ...criterion,
        tenderId: tender.id,
      },
    });
    console.log(`[ok] Criterion created: ${criterion.title} (${criterion.weight}%)`);
  }

  // 4. Create TechnicalMemory with 5 MemorySections
  const memory = await prisma.technicalMemory.upsert({
    where: { id: "memory-novatech-renovation-lyon" },
    update: {},
    create: {
      id: "memory-novatech-renovation-lyon",
      title: "Mémoire Technique - Rénovation Groupe Scolaire Jean Moulin",
      status: "DRAFT",
      summary: "Mémoire technique détaillé répondant point par point aux 5 critères de l'AO-2024-001245. Novatech BTP SAS propose une approche phasée sur 18 mois en site occupé, avec une équipe dédiée de 12 personnes dont 3 conducteurs de travaux expérimentés en rénovation scolaire.",
      tenderId: tender.id,
      organizationId: organization.id,
    },
  });
  console.log("[ok] TechnicalMemory created:", memory.title);

  // Get criteria for linking sections
  const criteria = await prisma.criterion.findMany({
    where: { tenderId: tender.id },
    orderBy: { order: "asc" },
  });

  // 5. Create 5 MemorySections linked to criteria
  const sectionsData = [
    {
      id: "section-methodologie",
      title: "1. Méthodologie d'exécution - Phasage et gestion en site occupé",
      content: `NOTRE MÉTHODOLOGIE D'EXÉCUTION POUR LA RÉNOVATION DU GROUPE SCOLAIRE JEAN MOULIN

1.1 APPROCHE GLOBALE ET PHASAGE
Novatech BTP SAS propose un phasage en 4 tranches principales sur 18 mois, calé sur le calendrier scolaire :
- Tranche 1 (Mois 1-4) : Aile Nord - Classes maternelles (vacances d'été + rentrée décalée)
- Tranche 2 (Mois 5-9) : Aile Sud - Classes élémentaires (vacances de Toussaint + Noël)
- Tranche 3 (Mois 10-14) : Parties communes, administration, cantine (vacances d'hiver + printemps)
- Tranche 4 (Mois 15-18) : Toitures, VMC, finitions, levée des réserves

1.2 PROTECTION DES OCCUPANTS ET GESTION DES INTERFACES
- Cloisonnements étanches classe A2-s1,d0 entre zones travaux et zones occupées
- Systèmes d'aspiration à la source sur tous les postes générateurs de poussières
- Cheminements protégés et signalisés pour élèves/personnel (norme NF P 98-351)
- Réunions de coordination hebdomadaires avec la direction de l'établissement
- Astreinte 24/7 pour intervention immédiate en cas d'incident

1.3 GESTION DES APPROVISIONNEMENTS ET LOGISTIQUE
- Zone de stockage déportée sur parking municipal (convention signée)
- Livraisons hors heures de classe (6h-7h30 et 18h-20h)
- Grue à tour positionnée en limite de propriété, rayon d'action couvrant l'ensemble

1.4 QUALITÉ ET CONTRÔLE
- Plan d'assurance qualité (PAQ) spécifique rénovation scolaire
- Autocontrôles quotidiens + contrôles tiers (bureau de contrôle SOCOTEC)
- Essais d'étanchéité à l'air (test blower door) par tranche`,
      wordCount: 0,
      order: 1,
      memoryId: memory.id,
      criterionId: criteria[0]?.id,
    },
    {
      id: "section-moyens-humains",
      title: "2. Moyens humains et encadrement - Équipe projet dédiée",
      content: `ÉQUIPE PROJET DÉDIÉE AU GROUPE SCOLAIRE JEAN MOULIN

2.1 ORGANIGRAMME DE CHANTIER
┌─ Directeur d'agence Lyon : M. Laurent DUBOIS (25 ans exp., 12 rénovations scolaires)
│
├─ Conducteur de travaux principal : M. Thomas MARTIN (15 ans exp., certifié HQE)
│   └─ Adjoint CT : Mme Sarah BERNARD (8 ans exp., spécialiste ITE)
│
├─ Chef de chantier Gros Œuvre / ITE : M. Karim BOUCHER (12 ans exp.)
│   ├─ 2 Maçons qualifiés (compagnons)
│   ├─ 2 Poseurs ITE certifiés RGE
│   └─ 1 Échafaudeur (CACES R408)
│
├─ Chef de chantier Second Œuvre / Menuiseries : M. Philippe ROUSSEAU (10 ans exp.)
│   ├─ 2 Menuisiers poseurs (qualification Qualibat)
│   └─ 1 Vitrier (spécialiste double vitrage feuilleté)
│
├─ Chef de chantier CVC / VMC : M. Antoine MOREAU (12 ans exp., attestation fluides)
│   └─ 2 Monteurs CVC (habilitation fluides frigorigènes)
│
└─ Coordinateur SPS (niveau 1) : Cabinet externe BUREAU VERITAS (attestation)

2.2 EFFECTIFS PRÉVISIONNELS PAR PHASE
- Phase 1-2 (Gros œuvre/ITE) : 14 personnes sur site
- Phase 3 (Second œuvre/CVC) : 10 personnes sur site
- Phase 4 (Finitions) : 6 personnes sur site

2.3 FORMATION ET QUALIFICATIONS
- 100% personnel formé « Travail en hauteur » + « Espaces confinés »
- 80% titulaires carte BTP + habilitation électrique BR/BC
- Plan formation annuel : 40h/an/personne (nouvelles techniques ITE, RE2020)`,
      wordCount: 0,
      order: 2,
      memoryId: memory.id,
      criterionId: criteria[1]?.id,
    },
    {
      id: "section-environnement",
      title: "3. Démarche environnementale et RSE - Chantier bas carbone",
      content: `DÉMARCHE ENVIRONNEMENTALE ET RSE - OBJECTIF CHANTIER BAS CARBONE

3.1 MATÉRIAUX BIOSOURCÉS ET RECYCLÉS
- Isolation ITE : Laine de bois (λ=0,038 W/m.K) - 65% biosourcé, FSC/PEFC
- Isolation toiture : Ouate de cellulose soufflée (recyclée à 85%)
- Menuiseries : Bois local (Douglas massif, origine France, PEFC)
- Enduits : Chaux-chanvre pour parements intérieurs (régulation hygrométrique)

3.2 GESTION DES DÉCHETS - OBJECTIF 85% VALORISATION
- Tri à la source : 7 flux (bois, métaux, plastiques, gravats inertes, plâtres, DIB, dangereux)
- Partenariat avec VEOLIA / PAPREC pour traçabilité (Bordereaux de Suivi de Déchets numériques)
- Réemploi in situ : Briques de démolition → remblais sous dalles (après concassage)
- Don matériel réemployable (radiateurs, sanitaires) → association EMMAÜS Lyon

3.3 BILAN CARBONE ET CHARTE CHANTIER BAS CARBONE
- Estimation CO2eq : 42 tCO2eq (vs 68 tCO2eq référence) = -38%
- Engins : 60% électriques/bioGNV (pelle 8T électrique, nacelles électrique, camion bioGNV)
- Énergie chantier : Raccordement réseau (pas de groupe électrogène) + 15 kWc photovoltaïque temporaire
- Transport personnel : Covoiturage incité, abonnements TCL pris en charge, local vélos sécurisé

3.4 INSERTION PROFESSIONNELLE ET CLAUSES SOCIALES
- 5% heures d'insertion (clause marché public) → partenariat ASFODEL Lyon
- 2 apprentis CAP Maçonnerie / BP Menuisier (CFA BTP Rhône-Alpes)
- Sensibilisation élèves : 3 ateliers « Métiers du BTP durable » avec l'école`,
      wordCount: 0,
      order: 3,
      memoryId: memory.id,
      criterionId: criteria[2]?.id,
    },
    {
      id: "section-planning",
      title: "4. Planning et phasage en site occupé - Calendrier détaillé 18 mois",
      content: `PLANNING DÉTAILLÉ - 18 MOIS EN SITE OCCUPÉ (JANVIER 2025 - JUIN 2026)

4.1 JALONS MAJEURS ALIGNÉS CALENDRIER SCOLAIRE
- [DONE] Janv 2025 : Installation chantier, cloisonnements, diagnostics amiante/plomb (pré-DA)
- [DONE] Fév-Mars 2025 : Tranche 1 - Aile Nord (vacances hiver + 2 semaines rentrée)
- [DONE] Avr-Mai 2025 : Tranche 2 - Aile Sud (vacances printemps)
- [DONE] Juin-Juill 2025 : Tranche 3 - Parties communes (grandes vacances - fenêtre optimale 8 sem.)
- [DONE] Sept-Nov 2025 : Tranche 4 - Toitures + VMC (vacances Toussaint)
- [DONE] Déc 2025-Janv 2026 : Second œuvre, menuiseries, CVC
- [DONE] Fév-Mars 2026 : Finitions, essais, mise en service
- [DONE] Avr-Juin 2026 : Levée réserves, réception, DOE, formation exploitant

4.2 CONTRAINTES SPÉCIFIQUES INTÉGRÉES
- Interdiction travaux bruyants : 12h-13h30 (sieste maternelle) + 16h-18h (sortie classes)
- Livraisons : Créneaux 6h-7h30 / 18h-20h uniquement
- Évacuation gravats : Bennes positionnées zone stockage déportée, rotation 2x/jour max
- Plan de circulation piétons/véhicules mis à jour chaque changement de tranche

4.3 OUTILS DE PILOTAGE
- Planning MS Project partagé (accès lecture Ville de Lyon + Maîtrise d'œuvre)
- Réunions hebdomadaires chantier (lundi 8h) + mensuelles comité de pilotage
- Tableau de bord indicateur : % avancement par tranche, retards, alertes sécurité,
  consommation eau/énergie, taux valorisation déchets`,
      wordCount: 0,
      order: 4,
      memoryId: memory.id,
      criterionId: criteria[3]?.id,
    },
    {
      id: "section-prix",
      title: "5. Prix des prestations - Décomposition détaillée et justifiée",
      content: `DÉCOMPOSITION DU PRIX GLOBAL FORFAITAIRE : 847 500 € HT

5.1 RÉPARTITION PAR LOTS TECHNIQUES
┌─────────────────────────────────────────────┬──────────────┬────────┐
│ Lot                                         │ Montant HT   │ %      │
├─────────────────────────────────────────────┼──────────────┼────────┤
│ 01 - Préparation, phasage, protections      │  68 500 €    │  8,1%  │
│ 02 - Démolitions / Déconstruction sélective │  42 000 €    │  5,0%  │
│ 03 - Isolation Thermique Extérieure (ITE)   │ 285 000 €    │ 33,6%  │
│ 04 - Couverture / Étanchéité toitures       │  95 000 €    │ 11,2%  │
│ 05 - Menuiseries extérieures / Vitrages     │ 165 000 €    │ 19,5%  │
│ 06 - CVC - VMC double flux                  │ 112 000 €    │ 13,2%  │
│ 07 - Électricité / Détection incendie       │  48 000 €    │  5,7%  │
│ 08 - Plâtrerie / Peintures / Finitions      │  32 000 €    │  3,8%  │
└─────────────────────────────────────────────┴──────────────┴────────┘
TOTAL HT : 847 500 €  (Marge nette 8,2% après charges de chantier)

5.2 JUSTIFICATION DES POSTES PRINCIPAUX
- Lot 03 ITE (285 k€) : 2 850 m² × 100 €/m² (laine bois 180mm + enduit chaux + fixation)
  → Prix marché 2024 vérifié (CSTB + index BT01)
- Lot 05 Menuiseries (165 k€) : 420 m² vitrage + 180 ml menuiseries bois
  → Double vitrage 4/16/4 FE (Uw=1,1) + ouvrants oscillo-battants
- Lot 06 VMC (112 k€) : 2 centrales double flux 4000 m³/h + réseau gaines isolées
  → Rendement >85%, by-pass été, pilotage CO2/classe

5.3 OPTIONS ET VARIANTES
- Option 1 : Photovoltaïque 36 kWc en toiture (+ 42 000 €)
- Option 2 : Récupération eau de pluie 10 m³ (+ 18 500 €)
- Variante bois : Structure ossature bois pour préau extension (+ 25 000 €)`,
      wordCount: 0,
      order: 5,
      memoryId: memory.id,
      criterionId: criteria[4]?.id,
    },
  ];

  for (const section of sectionsData) {
    await prisma.memorySection.upsert({
      where: { id: section.id },
      update: {},
      create: section,
    });
    console.log(`[ok] MemorySection created: ${section.title}`);
  }

  // 6. Create CerfaDocument (DC1)
  const cerfa = await prisma.cerfaDocument.upsert({
    where: { id: "cerfa-dc1-novatech" },
    update: {},
    create: {
      id: "cerfa-dc1-novatech",
      formNumber: "DC1",
      label: "Cerfa n° 11197*05 - Déclaration du candidat (DC1)",
      payload: JSON.stringify({
        // Identification du candidat
        raisonSociale: "Novatech BTP SAS",
        formeJuridique: "SAS",
        capitalSocial: "250000",
        siren: "834928192",
        siretSiege: "83492819200014",
        codeAPE: "4120A",
        tvaIntra: "FR12834928192",
        
        // Adresse
        adresse: "42 Rue de la République",
        complementAdresse: "Bâtiment B - 2ème étage",
        codePostal: "69002",
        ville: "Lyon",
        pays: "France",
        
        // Représentant légal
        representantLegal: {
          civilite: "M.",
          nom: "DUBOIS",
          prenom: "Laurent",
          fonction: "Président",
        },
        
        // Contact
        contact: {
          civilite: "Mme",
          nom: "BERNARD",
          prenom: "Sarah",
          email: "sarah.bernard@novatech-btp.fr",
          telephone: "04 72 00 00 01",
        },
        
        // Capacités professionnelles
        capacitesProfessionnelles: {
          inscriptionRegistre: "Registre du Commerce et des Sociétés de Lyon",
          numeroInscription: "834 928 192 RCS Lyon",
          qualifications: [
            "Qualibat 4111 - Isolation thermique par l'extérieur",
            "Qualibat 4511 - Menuiseries extérieures",
            "Qualibat 5311 - VMC double flux",
            "RGE - Reconnu Garant de l'Environnement",
          ],
          effectifMoyen: "42",
          chiffreAffaires: "5 200 000 €",
        },
        
        // Capacités techniques
        capacitesTechniques: {
          moyensHumains: "42 salariés dont 12 conducteurs de travaux/chefs de chantier",
          moyensMateriels: "Parc propre : 2 grues à tour, 4 nacelles, 3 pelles (dont 1 électrique), 6 camions",
          referencesPrincipales: [
            {
              annee: 2023,
              maitreOuvrage: "Ville de Villeurbanne",
              objet: "Rénovation énergétique Groupe Scolaire Jean Jaurès",
              montant: "720 000 € HT",
              procedura: "Appel d'offres ouvert",
            },
            {
              annee: 2022,
              maitreOuvrage: "Métropole de Lyon",
              objet: "Isolation thermique 3 collèges - Lot ITE",
              montant: "1 150 000 € HT",
              procedura: "Marché à bons de commande",
            },
            {
              annee: 2021,
              maitreOuvrage: "Région Auvergne-Rhône-Alpes",
              objet: "Rénovation lycée Simone Weil - Menuiseries + VMC",
              montant: "480 000 € HT",
              procedura: "Appel d'offres restreint",
            },
          ],
        },
        
        // Assurances
        assurances: {
          rcDecennale: {
            assureur: "SMABTP",
            numeroPolice: "SMABTP-2024-RC-834928",
            validite: "2025-12-31",
            montantGaranti: "5 000 000 €",
          },
          rcProfessionnelle: {
            assureur: "SMABTP",
            numeroPolice: "SMABTP-2024-RCP-834928",
            validite: "2025-12-31",
          },
          assurancesComplementaires: "Tous risques chantier - Garantie de parfait achèvement",
        },
        
        // Déclarations sur l'honneur
        declarationsHonneur: {
          nonCondamnation: true,
          regulariteFiscale: true,
          regulariteSociale: true,
          nonInterdictionSoumissionner: true,
          respectObligationsEmploi: true,
          respectObligationsFormation: true,
          absenceConflitInteret: true,
        },
        
        // Date et signature
        dateDeclaration: new Date().toISOString().split("T")[0],
        lieuDeclaration: "Lyon",
        signataire: "Laurent DUBOIS",
        qualiteSignataire: "Président",
      }, null, 2),
      memoryId: memory.id,
    },
  });
  console.log("[ok] CerfaDocument (DC1) created:", cerfa.formNumber);

  // 7. Create SireneCompany record
  const sireneCompany = await prisma.sireneCompany.upsert({
    where: { siren: "834928192" },
    update: {},
    create: {
      id: "sirene-novatech-btp",
      siren: "834928192",
      nic: "00014",
      denomination: "NOVATECH BTP SAS",
      legalForm: "5499 - Société par actions simplifiée",
      activityCode: "4120A - Construction de bâtiments résidentiels et non résidentiels",
      address: "42 RUE DE LA REPUBLIQUE",
      postalCode: "69002",
      city: "LYON",
      fetchedAt: new Date(),
    },
  });
  console.log("[ok] SireneCompany created:", sireneCompany.denomination);

  // Link organization to SireneCompany
  await prisma.organization.update({
    where: { id: organization.id },
    data: { sireneCompanyId: sireneCompany.id },
  });
  console.log("[ok] Organization linked to SireneCompany");

  console.log("\nSeed completed successfully!");
  console.log(`
Summary:
- 1 Organization: ${organization.name}
- 1 Tender: ${tender.title}
- 5 Criteria (total weight: 100%)
- 1 TechnicalMemory with 5 MemorySections
- 1 CerfaDocument (DC1 pre-filled)
- 1 SireneCompany (SIREN: ${sireneCompany.siren})
  `);
}

main()
  .catch((e) => {
    console.error("[seed] FAILED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });