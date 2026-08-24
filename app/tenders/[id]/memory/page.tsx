"use client";

import { Suspense, use } from "react";
import { MemoryPage } from "./components/MemoryPage";
import { getMemoryByTenderId } from "@/lib/actions/memories";

async function getMemoryData(tenderId: string) {
  const organizationId = "org-1";
  const result = await getMemoryByTenderId(tenderId, organizationId);
  if (result.success) {
    return result.data;
  }
  return null;
}

function PageSkeleton() {
  return (
    <div className="flex h-screen bg-background animate-pulse">
      <aside className="w-64 bg-card border-r border-border">
        <div className="p-4 border-b border-border">
          <div className="h-6 w-3/4 bg-muted rounded" />
        </div>
        <nav className="p-3 space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </nav>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between gap-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-8 w-32 bg-muted rounded" />
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 p-6">
            <div className="h-12 w-3/4 bg-muted rounded mb-4" />
            <div className="h-96 bg-muted rounded" />
          </div>
        </div>
        <div className="p-4 border-t border-border">
          <div className="h-8 w-1/3 bg-muted rounded" />
        </div>
      </main>
    </div>
  );
}

export default async function MemoryPageRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const initialData = await getMemoryData(id);

  return (
    <Suspense fallback={<PageSkeleton />}>
      <MemoryPage initialData={initialData} />
    </Suspense>
  );
}