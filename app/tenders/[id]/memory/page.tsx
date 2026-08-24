"use client";

import { Suspense, use } from "react";
import { CriterionSelectorSidebar } from "./components/CriterionSelectorSidebar";
import { SectionEditor } from "./components/SectionEditor";
import { CompletionProgressBar } from "./components/CompletionProgressBar";
import { GlobalProgressBar } from "./components/GlobalProgressBar";
import { AutoSaveIndicator } from "./components/AutoSaveIndicator";
import { MemoryHeader } from "./components/MemoryHeader";
import { getMemoryByTenderId } from "@/lib/actions/memories";

interface MemoryPageProps {
  params: Promise<{ id: string }>;
}

async function getMemoryData(tenderId: string) {
  const organizationId = "org-1";
  const result = await getMemoryByTenderId(tenderId, organizationId);
  if (result.success) {
    return result.data;
  }
  return null;
}

function MemoryPageContent({ tenderId }: { tenderId: string }) {
  const memoryPromise = getMemoryData(tenderId);

  return (
    <div className="flex h-screen bg-background">
      <Suspense fallback={<SidebarSkeleton />}>
        <CriterionSelectorSidebarWrapper memoryPromise={memoryPromise} />
      </Suspense>
      <main className="flex-1 flex flex-col overflow-hidden">
        <Suspense fallback={<HeaderSkeleton />}>
          <MemoryHeaderWrapper memoryPromise={memoryPromise} />
        </Suspense>
        <div className="flex-1 flex overflow-hidden">
          <Suspense fallback={<EditorSkeleton />}>
            <SectionEditorWrapper memoryPromise={memoryPromise} />
          </Suspense>
        </div>
        <Suspense fallback={<FooterSkeleton />}>
          <MemoryFooterWrapper memoryPromise={memoryPromise} />
        </Suspense>
      </main>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <aside className="w-64 bg-card border-r border-border animate-pulse">
      <div className="p-4 border-b border-border">
        <div className="h-6 w-3/4 bg-muted rounded" />
      </div>
      <nav className="p-3 space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-lg" />
        ))}
      </nav>
    </aside>
  );
}

function HeaderSkeleton() {
  return (
    <div className="p-4 border-b border-border animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-8 w-32 bg-muted rounded" />
      </div>
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className="flex-1 p-6 animate-pulse">
      <div className="h-12 w-3/4 bg-muted rounded mb-4" />
      <div className="h-96 bg-muted rounded" />
    </div>
  );
}

function FooterSkeleton() {
  return (
    <div className="p-4 border-t border-border animate-pulse">
      <div className="h-8 w-1/3 bg-muted rounded" />
    </div>
  );
}

function CriterionSelectorSidebarWrapper({ memoryPromise }: { memoryPromise: Promise<any> }) {
  const memory = use(memoryPromise);
  const criteria = memory?.tender?.criteria ?? [];
  const [selectedCriterionId, setSelectedCriterionId] = React.useState<string | null>(null);

  return (
    <CriterionSelectorSidebar
      criteria={criteria}
      selectedCriterionId={selectedCriterionId}
      onSelectCriterion={setSelectedCriterionId}
    />
  );
}

function MemoryHeaderWrapper({ memoryPromise }: { memoryPromise: Promise<any> }) {
  const memory = use(memoryPromise);
  return <MemoryHeader memory={memory} />;
}

function SectionEditorWrapper({ memoryPromise }: { memoryPromise: Promise<any> }) {
  const memory = use(memoryPromise);
  return <SectionEditor memory={memory} />;
}

function MemoryFooterWrapper({ memoryPromise }: { memoryPromise: Promise<any> }) {
  const memory = use(memoryPromise);
  return (
    <div className="p-4 border-t border-border bg-card/50">
      <GlobalProgressBar memory={memory} />
      <AutoSaveIndicator memory={memory} />
    </div>
  );
}

import React from "react";

export default async function MemoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MemoryPageContent tenderId={id} />;
}