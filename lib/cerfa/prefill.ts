import type { CerfaDocumentInput, DC1Input, DC2Input } from "@/lib/schemas/cerfa";

type OrgLike = {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
};

type SireneLike = {
  siren: string;
  nic?: string | null;
  denomination: string;
  legalForm?: string | null;
  activityCode?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
} | null;

type TenderLike = {
  reference: string;
  buyerName?: string | null;
};

function splitAddress(sirene: SireneLike, org: OrgLike) {
  return {
    address: sirene?.address ?? org.address ?? undefined,
    postalCode: sirene?.postalCode ?? org.postalCode ?? undefined,
    city: sirene?.city ?? org.city ?? undefined,
  };
}

export function buildPrefillPayload(args: {
  formType: "DC1" | "DC2";
  tender: TenderLike;
  org: OrgLike;
  sirene: SireneLike;
}): CerfaDocumentInput {
  const { formType, tender, org, sirene } = args;
  const addr = splitAddress(sirene, org);
  const rawActivity = sirene?.activityCode ?? undefined;
  // Normalise "4120A - Libellé complet" → "4120A" (le schema borne à 20).
  const activityCode = rawActivity ? rawActivity.split(" - ")[0].slice(0, 20) : undefined;
  const baseCandidate = {
    denomination: sirene?.denomination ?? org.name,
    siren: sirene?.siren,
    siret: sirene?.siren && sirene?.nic ? `${sirene.siren}${sirene.nic}` : undefined,
    legalForm: sirene?.legalForm ?? undefined,
    activityCode,
    ...addr,
    email: org.email ?? undefined,
    phone: org.phone ?? undefined,
  };

  if (formType === "DC1") {
    const dc1: DC1Input = {
      formType: "DC1",
      tenderReference: tender.reference,
      buyerName: tender.buyerName ?? "Acheteur public",
      buyerAddress: {},
      candidate: {
        ...baseCandidate,
        isGroup: false,
      },
      signatory: {
        firstName: "—",
        lastName: "—",
        role: "Représentant légal",
      },
      declarationDate: new Date(),
    };
    return dc1;
  }

  const dc2: DC2Input = {
    formType: "DC2",
    tenderReference: tender.reference,
    buyerName: tender.buyerName ?? "Acheteur public",
    candidate: {
      ...baseCandidate,
      isGroup: false,
    },
    capacity: {
      technical: [
        { description: "Références et qualifications équivalentes aux prestations demandées", evidence: "" },
      ],
      financial: [
        { description: "Chiffre d'affaires des trois derniers exercices disponibles", evidence: "" },
      ],
    },
    signatory: {
      firstName: "—",
      lastName: "—",
      role: "Représentant légal",
    },
    declarationDate: new Date(),
  };
  return dc2;
}
