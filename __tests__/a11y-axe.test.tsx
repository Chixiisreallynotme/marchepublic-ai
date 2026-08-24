import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { MemoryHeader } from "@/app/tenders/[id]/memory/components/MemoryHeader";
import { SectionEditor } from "@/app/tenders/[id]/memory/components/SectionEditor";
import { AutoSaveIndicator } from "@/app/tenders/[id]/memory/components/AutoSaveIndicator";
import { StatsCards } from "@/app/tenders/components/StatsCards";
import { EmptyState } from "@/app/tenders/components/EmptyState";
import { mockMemory, mockTenderList } from "./helpers/fixtures";

vi.mock("next/navigation", () => ({
  usePathname: () => "/tenders",
  useRouter: () => ({ push: vi.fn() }),
}));

describe("Audit accessibilité (axe-core, WCAG 2.1 AA)", () => {
  it("MemoryHeader — 0 violation axe", async () => {
    const { container } = render(<MemoryHeader memory={mockMemory} />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("SectionEditor — 0 violation axe", async () => {
    const { container } = render(
      <SectionEditor
        section={{
          id: "sec-1",
          title: "Offre économique",
          content: "Notre offre détaillée",
          wordCount: 4,
          criterionId: "crit-1",
          order: 0,
        }}
        criterionTitle="Prix"
        onSave={vi.fn().mockResolvedValue(true)}
      />
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("SectionEditor état vide — 0 violation axe", async () => {
    const { container } = render(
      <SectionEditor section={null} onSave={vi.fn().mockResolvedValue(true)} />
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("AutoSaveIndicator — 0 violation axe", async () => {
    const { container } = render(
      <AutoSaveIndicator isSaving={false} lastSaved={new Date()} hasChanges={false} />
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("StatsCards — 0 violation axe", async () => {
    const { container } = render(<StatsCards tenders={mockTenderList} />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("EmptyState — 0 violation axe", async () => {
    const { container } = render(<EmptyState />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
