import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { StatsCards, TenderGrid, TenderCard } from "@/app/tenders/components";
import { Breadcrumb, StatusBadge, MetadataGrid, CriterionCard, CriteriaSection, ActionButtons } from "@/app/tenders/[id]/components";
import { getTenders } from "@/lib/actions/tenders";

vi.mock("@/lib/actions/tenders");
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-sans", className: "", style: {} }),
  Geist_Mono: () => ({ variable: "--font-mono", className: "", style: {} }),
}));
vi.mock("next/link", () => ({
  default: function Link({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  },
}));

const mockTenders = [
  {
    id: "tender-1",
    title: "Construction école maternelle",
    reference: "AOO-2026-084-VM",
    description: "Construction d'une école maternelle de 12 classes",
    status: "IN_PROGRESS",
    procedureType: "APPEL_OFFRES_OUVERT",
    cpvCode: "45212345-6",
    buyerName: "Ville de Montpellier",
    estimatedValue: 850000,
    publicationDate: new Date("2026-01-15"),
    deadline: new Date("2026-03-15"),
    createdAt: new Date("2026-01-10"),
    updatedAt: new Date("2026-01-20"),
    organizationId: "org-1",
    organization: { id: "org-1", name: "Ville de Montpellier", role: "BUYER", email: null, phone: null, address: null, city: null, postalCode: null, createdAt: new Date(), updatedAt: new Date(), sireneCompanyId: null },
    _count: { criteria: 5 },
  },
  {
    id: "tender-2",
    title: "Fourniture mobilier urbain",
    reference: "AO-2026-012-PR",
    description: "Fourniture et installation de mobilier urbain",
    status: "DRAFT",
    procedureType: "PROCEDURE_ADAPTEE",
    cpvCode: "39131210-7",
    buyerName: "Communauté d'agglomération",
    estimatedValue: 120000,
    publicationDate: new Date("2026-02-01"),
    deadline: new Date("2026-04-01"),
    createdAt: new Date("2026-01-25"),
    updatedAt: new Date("2026-01-25"),
    organizationId: "org-2",
    organization: { id: "org-2", name: "Communauté d'agglomération", role: "BUYER", email: null, phone: null, address: null, city: null, postalCode: null, createdAt: new Date(), updatedAt: new Date(), sireneCompanyId: null },
    _count: { criteria: 3 },
  },
];

const mockTenderDetail = {
  id: "tender-1",
  title: "Construction école maternelle",
  reference: "AOO-2026-084-VM",
  description: "Construction d'une école maternelle de 12 classes avec cantine et préau.",
  status: "IN_PROGRESS",
  procedureType: "APPEL_OFFRES_OUVERT",
  cpvCode: "45212345-6",
  buyerName: "Ville de Montpellier",
  estimatedValue: 850000,
  publicationDate: new Date("2026-01-15"),
  deadline: new Date("2026-03-15"),
  createdAt: new Date("2026-01-10"),
  updatedAt: new Date("2026-01-20"),
  organizationId: "org-1",
  organization: { id: "org-1", name: "Ville de Montpellier", role: "BUYER", email: null, phone: null, address: null, city: null, postalCode: null, createdAt: new Date(), updatedAt: new Date(), sireneCompanyId: null },
  criteria: [
    { id: "crit-1", title: "Prix", description: "Offre économique la plus avantageuse", weight: 40, order: 1, sections: [{ id: "sec-1" }] },
    { id: "crit-2", title: "Valeur technique", description: "Qualité de la proposition technique", weight: 35, order: 2, sections: [{ id: "sec-2" }] },
    { id: "crit-3", title: "Délais", description: "Respect du calendrier d'exécution", weight: 15, order: 3, sections: [] },
    { id: "crit-4", title: "Garanties", description: "Garanties décennales et biennales", weight: 10, order: 4, sections: [] },
  ],
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("StatsCards", () => {
  it("renders summary statistics cards", () => {
    render(<StatsCards tenders={mockTenders} />);

    expect(screen.getByText(/total d'appels d'offres/i)).toBeInTheDocument();
    expect(screen.getByText(/en cours de rédaction/i)).toBeInTheDocument();
    expect(screen.getByText(/montant total estimé/i)).toBeInTheDocument();
expect(screen.getByText(/taux de succès estimé/i)).toBeInTheDocument();
    expect(screen.getAllByText("2")).toHaveLength(2);
    expect(screen.getByText(/970.*000.*€/)).toBeInTheDocument();
  });
});

describe("TenderGrid", () => {
  it("renders tender cards with all required information", () => {
    render(<TenderGrid tenders={mockTenders} />);

    expect(screen.getByText("Construction école maternelle")).toBeInTheDocument();
    expect(screen.getByText("AOO-2026-084-VM")).toBeInTheDocument();
    expect(screen.getByText(/appel d'offres ouvert/i)).toBeInTheDocument();
    expect(screen.getByText("Ville de Montpellier")).toBeInTheDocument();
    expect(screen.getByText("CPV 45212345-6")).toBeInTheDocument();
    expect(screen.getByText("850 000 €")).toBeInTheDocument();
    expect(screen.getByText(/5 critères/i)).toBeInTheDocument();
    expect(screen.getByText(/3 critères/i)).toBeInTheDocument();

    const links = screen.getAllByRole("link", { name: /consulter le dossier/i });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/tenders/tender-1");
  });

  it("renders deadline badge with days remaining (expired)", () => {
    render(<TenderGrid tenders={mockTenders} />);

    expect(screen.getAllByText(/expiré/i)).toHaveLength(2);
  });

  it("renders empty state when no tenders exist", () => {
    render(<TenderGrid tenders={[]} />);

    expect(screen.getByText(/aucun appel d'offres/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /créer votre premier dossier/i })).toBeInTheDocument();
  });
});

describe("TenderCard", () => {
  it("renders TenderCard with all required information", () => {
    render(<TenderCard tender={mockTenders[0]} />);

    expect(screen.getByText("Construction école maternelle")).toBeInTheDocument();
    expect(screen.getByText("AOO-2026-084-VM")).toBeInTheDocument();
    expect(screen.getByText(/appel d'offres ouvert/i)).toBeInTheDocument();
    expect(screen.getByText("Ville de Montpellier")).toBeInTheDocument();
    expect(screen.getByText("CPV 45212345-6")).toBeInTheDocument();
    expect(screen.getByText("850 000 €")).toBeInTheDocument();
    expect(screen.getByText(/5 critères/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /consulter le dossier/i })).toHaveAttribute("href", "/tenders/tender-1");
  });
});

describe("Breadcrumb", () => {
  it("renders breadcrumb navigation", () => {
    render(<Breadcrumb />);

    expect(screen.getByRole("link", { name: /accueil/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /appels d'offres/i })).toBeInTheDocument();
  });
});

describe("StatusBadge", () => {
  it("renders StatusBadge with correct status", () => {
    render(<StatusBadge status="IN_PROGRESS" />);

    expect(screen.getByText(/en cours/i)).toBeInTheDocument();
  });
});

describe("ActionButtons", () => {
  it("renders action buttons with correct links", () => {
    render(<ActionButtons tenderId="tender-1" />);

    expect(screen.getByRole("link", { name: /rédiger le mémoire technique/i })).toHaveAttribute("href", "/tenders/tender-1/memory");
    expect(screen.getByRole("link", { name: /générer cerfa dc1\/dc2/i })).toHaveAttribute("href", "/cerfa?tenderId=tender-1");
    expect(screen.getByRole("link", { name: /voir fiche sirene/i })).toHaveAttribute("href", "/sirene");
  });
});

describe("MetadataGrid", () => {
  it("renders metadata grid with all fields", () => {
    render(<MetadataGrid tender={mockTenderDetail} />);

    expect(screen.getByText(/acheteur public/i)).toBeInTheDocument();
    expect(screen.getByText(/date limite de dépôt/i)).toBeInTheDocument();
    expect(screen.getByText(/montant estimé/i)).toBeInTheDocument();
    expect(screen.getByText(/code cpv/i)).toBeInTheDocument();
    expect(screen.getByText(/type de procédure/i)).toBeInTheDocument();
    expect(screen.getByText(/description/i)).toBeInTheDocument();
  });

  it("renders MetadataGrid with correct formatted values", () => {
    render(<MetadataGrid tender={mockTenderDetail} />);

    expect(screen.getByText("Ville de Montpellier")).toBeInTheDocument();
    expect(screen.getByText("850 000 €")).toBeInTheDocument();
    expect(screen.getByText("45212345-6")).toBeInTheDocument();
    expect(screen.getByText(/appel d'offres ouvert/i)).toBeInTheDocument();
  });
});

describe("CriteriaSection", () => {
  it("renders criteria breakdown with weights and progress bars", () => {
    render(<CriteriaSection criteria={mockTenderDetail.criteria} />);

    expect(screen.getByRole("heading", { name: /critères d'évaluation/i })).toBeInTheDocument();
    expect(screen.getByText(/total: 100%/i)).toBeInTheDocument();

    expect(screen.getByText("Prix")).toBeInTheDocument();
    expect(screen.getByText("Valeur technique")).toBeInTheDocument();
    expect(screen.getByText("Délais")).toBeInTheDocument();
    expect(screen.getByText("Garanties")).toBeInTheDocument();

    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("35%")).toBeInTheDocument();
    expect(screen.getByText("15%")).toBeInTheDocument();
    expect(screen.getByText("10%")).toBeInTheDocument();

    const progressBars = screen.getAllByRole("progressbar");
    expect(progressBars).toHaveLength(4);
  });

  it("shows memory section completion status per criterion", () => {
    render(<CriteriaSection criteria={mockTenderDetail.criteria} />);

    expect(screen.getAllByText(/mémoire: 1 section rédigée/i)).toHaveLength(2);
    expect(screen.getAllByText(/mémoire: non commencé/i)).toHaveLength(2);
  });

  it("renders weight distribution visualization", () => {
    render(<CriteriaSection criteria={mockTenderDetail.criteria} />);

    expect(screen.getByText(/répartition des poids/i)).toBeInTheDocument();
    const visualBarContainer = screen.getByRole("img", { name: /répartition visuelle des poids totalisant/i });
    expect(visualBarContainer).toBeInTheDocument();
  });

  it("shows warning when total weight exceeds 100%", () => {
    const tenderWithOverweight = {
      ...mockTenderDetail,
      criteria: [
        { id: "crit-1", title: "Critère 1", description: "", weight: 60, order: 1, sections: [] },
        { id: "crit-2", title: "Critère 2", description: "", weight: 50, order: 2, sections: [] },
      ],
    };
    render(<CriteriaSection criteria={tenderWithOverweight.criteria} />);

    expect(screen.getByText(/dépasse 100%/i)).toBeInTheDocument();
  });

  it("shows warning when total weight is less than 100%", () => {
    const tenderWithUnderweight = {
      ...mockTenderDetail,
      criteria: [
        { id: "crit-1", title: "Critère 1", description: "", weight: 30, order: 1, sections: [] },
        { id: "crit-2", title: "Critère 2", description: "", weight: 20, order: 2, sections: [] },
      ],
    };
    render(<CriteriaSection criteria={tenderWithUnderweight.criteria} />);

    expect(screen.getByText(/incomplet/i)).toBeInTheDocument();
  });
});

describe("CriterionCard", () => {
  it("renders CriterionCard with correct weight percentage", () => {
    const criterion = mockTenderDetail.criteria[0];
    render(<CriterionCard criterion={criterion} totalWeight={100} />);

    expect(screen.getByText("Prix")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "40");
  });

  it("renders CriterionCard with sections indicator", () => {
    const criterion = mockTenderDetail.criteria[0];
    render(<CriterionCard criterion={criterion} totalWeight={100} />);

    expect(screen.getByText(/mémoire: 1 section rédigée/i)).toBeInTheDocument();
  });

  it("renders CriterionCard without sections indicator", () => {
    const criterion = mockTenderDetail.criteria[2];
    render(<CriterionCard criterion={criterion} totalWeight={100} />);

    expect(screen.getByText(/mémoire: non commencé/i)).toBeInTheDocument();
  });
});
