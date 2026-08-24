export interface Criterion {
  id: string;
  title: string;
  description?: string | null;
  weight: number;
  order: number;
}

export interface Section {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  criterionId?: string | null;
  criterion?: {
    id: string;
    title: string;
  } | null;
  order: number;
}

export interface MemoryData {
  id: string;
  title: string;
  status: string;
  summary?: string | null;
  updatedAt: Date | string;
  tender: {
    id: string;
    title: string;
    criteria: Criterion[];
  };
  sections: Section[];
}