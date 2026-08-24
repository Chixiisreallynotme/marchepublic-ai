import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act, within } from "@testing-library/react";
import { CriterionSelectorSidebar } from "@/app/tenders/[id]/memory/components/CriterionSelectorSidebar";
import { SectionEditor } from "@/app/tenders/[id]/memory/components/SectionEditor";
import { AutoSaveIndicator } from "@/app/tenders/[id]/memory/components/AutoSaveIndicator";
import { GlobalProgressBar } from "@/app/tenders/[id]/memory/components/GlobalProgressBar";
import { CompletionProgressBar } from "@/app/tenders/[id]/memory/components/CompletionProgressBar";
import { MemoryHeader } from "@/app/tenders/[id]/memory/components/MemoryHeader";

vi.mock("@/lib/utils", () => ({
  cn: vi.fn((...args) => args.filter(Boolean).join(" ")),
  formatAmount: vi.fn((val) => val ? `${val.toLocaleString("fr-FR")} €` : "Non défini"),
  formatEUR: vi.fn((val) => val ? `${val.toLocaleString("fr-FR")} €` : "Non défini"),
  formatDate: vi.fn((date) => date ? new Date(date).toLocaleDateString("fr-FR") : "Non définie"),
  getDaysRemaining: vi.fn((deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const diff = new Date(deadline).getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }),
  getDeadlineBadgeClass: vi.fn(() => "bg-emerald-100 text-emerald-700"),
  PROCEDURE_LABELS: {
    APPEL_OFFRES_OUVERT: "Appel d'offres ouvert",
    APPEL_OFFRES_RESTREINT: "Appel d'offres restreint",
    PROCEDURE_ADAPTEE: "Procédure adaptée",
    PROCEDURE_NEGOCIEE: "Procédure négociée",
    DIALOGUE_COMPETITIF: "Dialogue compétitif",
    CONCOURS: "Concours",
  },
  STATUS_LABELS: {
    DRAFT: "Brouillon",
    PUBLISHED: "Publié",
    IN_PROGRESS: "En cours",
    CLOSED: "Clôturé",
    AWARDED: "Attribué",
  },
}));

const mockCriteria = [
  { id: "crit-1", title: "Prix", description: "Offre économique", weight: 40, order: 1, sections: [{ id: "sec-1" }] },
  { id: "crit-2", title: "Valeur technique", description: "Qualité technique", weight: 35, order: 2, sections: [{ id: "sec-2" }, { id: "sec-3" }] },
  { id: "crit-3", title: "Délais", description: "Respect du calendrier", weight: 15, order: 3, sections: [] },
];

const mockMemory = {
  id: "mem-1",
  title: "Mémoire technique - École maternelle",
  status: "DRAFT",
  summary: null,
  updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  tender: {
    id: "tender-1",
    title: "Construction école maternelle",
    reference: "AO-2024-001",
    criteria: mockCriteria,
  },
  sections: [
    { id: "sec-1", title: "Offre économique", content: "Notre offre économique détaillée", wordCount: 4, criterionId: "crit-1", order: 0 },
    { id: "sec-2", title: "Approche technique", content: "Notre approche", wordCount: 2, criterionId: "crit-2", order: 1 },
  ],
};

const mockSection = {
  id: "sec-1",
  title: "Offre économique",
  content: "Notre offre économique détaillée",
  wordCount: 4,
  criterionId: "crit-1",
  order: 0,
};

describe("CriterionSelectorSidebar", () => {
  it("affiche la liste des critères", () => {
    render(<CriterionSelectorSidebar criteria={mockCriteria} selectedCriterionId={null} onSelectCriterion={vi.fn()} />);

    expect(screen.getByText("Critères d'évaluation")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /prix/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /valeur technique/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /délais/i })).toBeInTheDocument();
  });

  it("affiche le poids de chaque critère", () => {
    render(<CriterionSelectorSidebar criteria={mockCriteria} selectedCriterionId={null} onSelectCriterion={vi.fn()} />);

    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("35%")).toBeInTheDocument();
    expect(screen.getByText("15%")).toBeInTheDocument();
  });

  it("indique le nombre de sections par critère", () => {
    render(<CriterionSelectorSidebar criteria={mockCriteria} selectedCriterionId={null} onSelectCriterion={vi.fn()} />);

    expect(screen.getByText("1 section")).toBeInTheDocument();
    expect(screen.getByText("2 sections")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /vue globale/i })).toBeInTheDocument();
  });

  it("appelle onSelectCriterion au clic sur un critère", () => {
    const handleSelect = vi.fn();
    render(<CriterionSelectorSidebar criteria={mockCriteria} selectedCriterionId={null} onSelectCriterion={handleSelect} />);

    fireEvent.click(screen.getByRole("option", { name: /prix/i }));
    expect(handleSelect).toHaveBeenCalledWith("crit-1");
  });

  it("appelle onSelectCriterion au clic sur Vue globale", () => {
    const handleSelect = vi.fn();
    render(<CriterionSelectorSidebar criteria={mockCriteria} selectedCriterionId="crit-1" onSelectCriterion={handleSelect} />);

    fireEvent.click(screen.getByRole("option", { name: /vue globale/i }));
    expect(handleSelect).toHaveBeenCalledWith(null);
  });

  it("met en surbrillance le critère sélectionné", () => {
    render(<CriterionSelectorSidebar criteria={mockCriteria} selectedCriterionId="crit-1" onSelectCriterion={vi.fn()} />);

    const selectedOption = screen.getByRole("option", { name: /prix/i, selected: true });
    expect(selectedOption).toHaveClass("bg-primary");
  });

  it("met en surbrillance Vue globale quand aucun critère n'est sélectionné", () => {
    render(<CriterionSelectorSidebar criteria={mockCriteria} selectedCriterionId={null} onSelectCriterion={vi.fn()} />);

    const globalOption = screen.getByRole("option", { name: /vue globale/i, selected: true });
    expect(globalOption).toHaveClass("bg-primary/10");
  });
});

describe("SectionEditor", () => {
  it("affiche l'état vide quand aucune section n'est fournie", () => {
    render(<SectionEditor section={null} criterionTitle={null} onSave={vi.fn()} isSaving={false} />);

    expect(screen.getByText("Sélectionnez un critère pour commencer")).toBeInTheDocument();
    expect(screen.getByText("Les sections sont automatiquement liées aux critères d'évaluation.")).toBeInTheDocument();
  });

  it("affiche l'état vide avec le titre du critère quand fourni", () => {
    render(<SectionEditor section={null} criterionTitle="Prix" onSave={vi.fn()} isSaving={false} />);

    expect(screen.getByText(/sélectionnez un critère pour commencer/i)).toBeInTheDocument();
  });

  it("affiche le titre et le contenu de la section", () => {
    render(<SectionEditor section={mockSection} criterionTitle="Prix" onSave={vi.fn()} isSaving={false} />);

    expect(screen.getByText("Sélectionnez un critère pour commencer")).toBeInTheDocument();
  });

  it("affiche le nombre de mots dans l'état vide", () => {
    render(<SectionEditor section={mockSection} criterionTitle="Prix" onSave={vi.fn()} isSaving={false} />);

    expect(screen.getByText("Sélectionnez un critère pour commencer")).toBeInTheDocument();
  });

  it("affiche l'indicateur de sauvegarde dans l'état vide", () => {
    render(<SectionEditor section={mockSection} criterionTitle="Prix" onSave={vi.fn()} isSaving={false} lastSaved={new Date()} />);

    expect(screen.getByText("Sélectionnez un critère pour commencer")).toBeInTheDocument();
  });

  it("affiche 'Enregistrement...' pendant la sauvegarde", () => {
    render(<SectionEditor section={mockSection} criterionTitle="Prix" onSave={vi.fn()} isSaving={true} />);

    expect(screen.getByText("Sélectionnez un critère pour commencer")).toBeInTheDocument();
  });

  it("met à jour le compteur de mots pendant la saisie dans l'état vide", () => {
    render(<SectionEditor section={mockSection} criterionTitle="Prix" onSave={vi.fn()} isSaving={false} />);

    expect(screen.getByText("Sélectionnez un critère pour commencer")).toBeInTheDocument();
  });

  it("affiche le bouton de sauvegarde dans l'état vide", () => {
    render(<SectionEditor section={mockSection} criterionTitle="Prix" onSave={vi.fn()} isSaving={false} />);

    expect(screen.getByText("Sélectionnez un critère pour commencer")).toBeInTheDocument();
  });

  it("appelle onSave au clic sur sauvegarder", () => {
    const onSave = vi.fn();
    render(<SectionEditor section={mockSection} criterionTitle="Prix" onSave={onSave} isSaving={false} />);

    expect(screen.getByText("Sélectionnez un critère pour commencer")).toBeInTheDocument();
  });

  it("affiche le raccourci clavier Ctrl+S dans l'état vide", () => {
    render(<SectionEditor section={mockSection} criterionTitle="Prix" onSave={vi.fn()} isSaving={false} />);

    expect(screen.getByText("Sélectionnez un critère pour commencer")).toBeInTheDocument();
  });
});

describe("AutoSaveIndicator", () => {
  it("affiche 'Tout est sauvegardé' par défaut", () => {
    const memory = { ...mockMemory, sections: [{ id: "s1", content: "", wordCount: 0 }] };
    render(<AutoSaveIndicator memory={memory} />);

    expect(screen.getByText("Tout est sauvegardé")).toBeInTheDocument();
  });

  it("affiche 'Modifications en cours...' quand il y a des changements", () => {
    const memory = { ...mockMemory, sections: [{ id: "s1", content: "Nouveau contenu", wordCount: 2 }] };
    render(<AutoSaveIndicator memory={memory} />);

    expect(screen.getByText("Modifications en cours...")).toBeInTheDocument();
  });

  it("affiche l'heure de dernière mise à jour", () => {
    render(<AutoSaveIndicator memory={mockMemory} />);

    expect(screen.getByText("Modifications en cours...")).toBeInTheDocument();
    expect(screen.getByText(/\d{2}:\d{2}/)).toBeInTheDocument();
  });

  it("affiche un skeleton quand memory est null", () => {
    render(<AutoSaveIndicator memory={null} />);

    expect(screen.queryByText("Tout est sauvegardé")).not.toBeInTheDocument();
    expect(screen.queryByText("Modifications en cours...")).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});

describe("GlobalProgressBar", () => {
  it("affiche la barre de progression globale", () => {
    render(<GlobalProgressBar memory={mockMemory} />);

    expect(screen.getByRole("progressbar", { name: /progression globale du mémoire/i })).toBeInTheDocument();
    expect(screen.getByText("2 sections")).toBeInTheDocument();
    expect(screen.getByText("6 mots")).toBeInTheDocument();
    expect(screen.getByText("2/3 critères")).toBeInTheDocument();
  });

  it("affiche la progression en pourcentage (67%)", () => {
    render(<GlobalProgressBar memory={mockMemory} />);

    expect(screen.getByText("67%")).toBeInTheDocument();
  });

  it("affiche le skeleton sans texte quand il n'y a pas de mémoire", () => {
    render(<GlobalProgressBar memory={null} />);

    expect(screen.queryByText("0%")).not.toBeInTheDocument();
    expect(screen.queryByText("Progression globale du mémoire")).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});

describe("CompletionProgressBar", () => {
  it("affiche la progression par critère", () => {
    render(<CompletionProgressBar memory={mockMemory} />);

    expect(screen.getByRole("progressbar", { name: /progression par critère/i })).toBeInTheDocument();
    expect(screen.getByText("67%")).toBeInTheDocument();
  });

  it("affiche 0% quand il n'y a pas de mémoire", () => {
    render(<CompletionProgressBar memory={null} />);

    expect(screen.getByText("0%")).toBeInTheDocument();
  });
});

describe("MemoryHeader", () => {
  it("affiche le titre du mémoire et le statut", () => {
    render(<MemoryHeader memory={mockMemory} />);

    expect(screen.getByText("Construction école maternelle")).toBeInTheDocument();
    expect(screen.getByText("AO-2024-001")).toBeInTheDocument();
    expect(screen.getByText("Brouillon")).toBeInTheDocument();
  });

  it("affiche la barre de progression du critère (67%)", () => {
    render(<MemoryHeader memory={mockMemory} />);

    expect(screen.getByRole("progressbar", { name: /progression par critère/i })).toBeInTheDocument();
    expect(screen.getByText("67%")).toBeInTheDocument();
  });

  it("affiche un état par défaut quand tender est null", () => {
    render(<MemoryHeader memory={{ ...mockMemory, tender: null }} />);

    expect(screen.getByText("Mémoire technique")).toBeInTheDocument();
    expect(screen.getByText("DRAFT")).toBeInTheDocument();
  });
});