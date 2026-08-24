"use client";

import { useState, useEffect } from "react";
import { MemoryHeader } from "./MemoryHeader";
import { CriterionSelectorSidebar } from "./CriterionSelectorSidebar";
import { SectionEditor } from "./SectionEditor";
import { AutoSaveIndicator } from "./AutoSaveIndicator";
import { GlobalProgressBar } from "./GlobalProgressBar";

interface Criterion {
  id: string;
  title: string;
  description?: string | null;
  weight: number;
  order: number;
  sections: { id: string }[];
}

interface Section {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  criterionId: string | null;
  order: number;
}

interface Tender {
  id: string;
  title: string;
  reference: string;
  criteria: Criterion[];
}

interface TechnicalMemoryWithRelations {
  id: string;
  title: string;
  status: "DRAFT" | "IN_REVIEW" | "SUBMITTED";
  summary?: string | null;
  updatedAt: string;
  tender: Tender;
  sections: Section[];
}

interface MemoryPageProps {
  initialData: TechnicalMemoryWithRelations | null;
}

export function MemoryPage({ initialData }: MemoryPageProps) {
  const [memory, setMemory] = useState<TechnicalMemoryWithRelations | null>(initialData);
  const [selectedCriterionId, setSelectedCriterionId] = useState<string | null>(null);

  useEffect(() => {
    setMemory(initialData);
  }, [initialData]);

  const criteria = memory?.tender?.criteria ?? [];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <MemoryHeader memory={memory} />

      <div className="flex-1 flex overflow-hidden">
        <CriterionSelectorSidebar
          criteria={criteria}
          selectedCriterionId={selectedCriterionId}
          onSelectCriterion={setSelectedCriterionId}
        />

        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="p-4 border-b border-border bg-card/50">
            <GlobalProgressBar memory={memory} />
          </div>

          <div className="flex-1 flex overflow-hidden min-w-0">
            <SectionEditor memory={memory} />
          </div>

          <div className="p-4 border-t border-border bg-card/50 flex-shrink-0">
            <AutoSaveIndicator memory={memory} />
          </div>
        </main>
      </div>
    </div>
  );
}