import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act, within } from "@testing-library/react";
import { CriterionSelectorSidebar } from "@/app/tenders/[id]/memory/components/CriterionSelectorSidebar";
import { SectionEditor } from "@/app/tenders/[id]/memory/components/SectionEditor";
import { AutoSaveIndicator } from "@/app/tenders/[id]/memory/components/AutoSaveIndicator";
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
    const mockSections = [
      { id: "sec-1", criterionId: "crit-1" },
      { id: "sec-2", criterionId: "crit-2" },
      { id: "sec-3", criterionId: "crit-2" },
    ];
    render(<CriterionSelectorSidebar criteria={mockCriteria} sections={mockSections} selectedCriterionId={null} onSelectCriterion={vi.fn()} />);

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
    render(<SectionEditor section={null} criterionTitle={undefined} onSave={vi.fn()} />);

    expect(screen.getByText("Sélectionnez un critère pour commencer")).toBeInTheDocument();
    expect(screen.getByText("Les sections sont automatiquement liées aux critères d'évaluation.")).toBeInTheDocument();
  });

  it("affiche l'état vide avec le titre du critère quand fourni", () => {
    render(<SectionEditor section={null} criterionTitle="Prix" onSave={vi.fn()} />);

    expect(screen.getByText(/sélectionnez un critère pour commencer/i)).toBeInTheDocument();
  });

  it("affiche le titre et le contenu de la section", () => {
    render(<SectionEditor section={mockSection} criterionTitle="Prix" onSave={vi.fn()} />);

    expect(screen.getByText("Offre économique")).toBeInTheDocument();
    expect(screen.getByText("Notre offre économique détaillée")).toBeInTheDocument();
  });

  it("affiche le nombre de mots", () => {
    render(<SectionEditor section={mockSection} criterionTitle="Prix" onSave={vi.fn()} />);

    expect(screen.getByText("4 mots")).toBeInTheDocument();
  });

  it("affiche le bouton Enregistrer et l'état non enregistré après saisie", async () => {
    vi.useFakeTimers();
    render(<SectionEditor section={mockSection} criterionTitle="Prix" onSave={vi.fn().mockResolvedValue(true)} />);

    expect(screen.getByRole("button", { name: /enregistrer/i })).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/rédigez votre contenu/i);
    fireEvent.change(textarea, { target: { value: "Contenu modifié" } });
    expect(screen.getByText(/modifications non enregistrées/i)).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("déclenche la sauvegarde au clic sur Enregistrer", async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    render(<SectionEditor section={mockSection} criterionTitle="Prix" onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(screen.getByText(/enregistré à/i)).toBeInTheDocument();
  });

  it("met à jour le compteur de mots pendant la saisie", () => {
    render(<SectionEditor section={mockSection} criterionTitle="Prix" onSave={vi.fn()} />);

    const textarea = screen.getByPlaceholderText(/rédigez votre contenu/i);
    fireEvent.change(textarea, { target: { value: "Nouveau contenu test" } });

    expect(screen.getByText("3 mots")).toBeInTheDocument();
  });

  it("sauvegarde automatiquement après le délai (autosave 1,5 s)", async () => {
    vi.useFakeTimers();
    try {
      const onSave = vi.fn().mockResolvedValue(true);
      render(<SectionEditor section={mockSection} criterionTitle="Prix" onSave={onSave} />);

      fireEvent.change(screen.getByPlaceholderText(/rédigez votre contenu/i), {
        target: { value: "Saisie autosave" },
      });
      expect(onSave).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1600);
      expect(onSave).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("sauvegarde au blur après modification", async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    render(<SectionEditor section={mockSection} criterionTitle="Prix" onSave={onSave} />);

    const textarea = screen.getByPlaceholderText(/rédigez votre contenu/i);
    fireEvent.change(textarea, { target: { value: "Blur save" } });
    fireEvent.blur(textarea);
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  });

  it("affiche le bouton de suppression quand onDelete est fourni", () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(<SectionEditor section={mockSection} criterionTitle="Prix" onSave={vi.fn()} onDelete={onDelete} />);

    const deleteButton = screen.getByLabelText("Supprimer la section");
    expect(deleteButton).toBeInTheDocument();
  });

  it("appelle onDelete au clic sur supprimer", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(<SectionEditor section={mockSection} criterionTitle="Prix" onSave={vi.fn()} onDelete={onDelete} />);

    const deleteButton = screen.getByLabelText("Supprimer la section");
    fireEvent.click(deleteButton);
    
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith("sec-1"));
  });

  it("ne montre pas le bouton de suppression quand onDelete n'est pas fourni", () => {
    render(<SectionEditor section={mockSection} criterionTitle="Prix" onSave={vi.fn()} />);

    expect(screen.queryByLabelText("Supprimer la section")).not.toBeInTheDocument();
  });

  it("permet d'éditer le titre au double-clic", () => {
    render(<SectionEditor section={mockSection} criterionTitle="Prix" onSave={vi.fn()} />);

    const title = screen.getByText("Offre économique");
    fireEvent.dblClick(title);
    
    const input = screen.getByLabelText("Titre de la section");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("Offre économique");
  });
});

describe("AutoSaveIndicator", () => {
  it("affiche un skeleton par défaut (pas de lastSaved, pas de sauvegarde, pas de changements)", () => {
    render(<AutoSaveIndicator isSaving={false} lastSaved={null} hasChanges={false} />);

    expect(screen.queryByText("Tout est sauvegardé")).not.toBeInTheDocument();
    expect(screen.queryByText("Sauvegarde en cours...")).not.toBeInTheDocument();
    expect(screen.queryByText("Modifications en cours...")).not.toBeInTheDocument();
    expect(screen.getByTestId("autosave-skeleton")).toBeInTheDocument();
  });

  it("affiche 'Modifications en cours...' quand il y a des changements", () => {
    render(<AutoSaveIndicator isSaving={false} lastSaved={null} hasChanges={true} />);

    expect(screen.getByText("Modifications en cours...")).toBeInTheDocument();
  });

  it("affiche 'Sauvegarde en cours...' quand isSaving est true", () => {
    render(<AutoSaveIndicator isSaving={true} lastSaved={null} hasChanges={false} />);

    expect(screen.getByText("Sauvegarde en cours...")).toBeInTheDocument();
  });

  it("affiche l'heure de dernière mise à jour", () => {
    const lastSaved = new Date("2024-01-15T10:30:00");
    render(<AutoSaveIndicator isSaving={false} lastSaved={lastSaved} hasChanges={false} />);

    expect(screen.getByText("10:30")).toBeInTheDocument();
  });

  it("affiche un skeleton quand tout est null", () => {
    render(<AutoSaveIndicator isSaving={false} lastSaved={null} hasChanges={false} />);

    expect(screen.queryByText("Modifications en cours...")).not.toBeInTheDocument();
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
    render(
      <MemoryHeader
        memory={null}
      />
    );

    expect(screen.getByText("Mémoire technique")).toBeInTheDocument();
    expect(screen.getByText("DRAFT")).toBeInTheDocument();
  });
});