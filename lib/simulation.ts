import { z } from "zod";

export type CriterionScore = {
  id: string;
  title: string;
  weight: number;
  sectionsTotal: number;
  sectionsDone: number;
  completion: number; // 0..1
  weightedPoints: number; // weight * completion
};

export type SimulationResult = {
  memoryId: string;
  memoryTitle: string;
  tenderId: string;
  tenderTitle: string;
  criteria: CriterionScore[];
  score100: number;
  score20: number;
};

const sectionSchema = z.object({
  content: z.string(),
  criterionId: z.string().nullable(),
});

const criterionSchema = z.object({
  id: z.string(),
  title: z.string(),
  weight: z.number(),
});

export const simulationInputSchema = z.object({
  id: z.string(),
  title: z.string(),
  tenderId: z.string(),
  tenderTitle: z.string(),
  sections: z.array(sectionSchema),
  tender: z.object({ criteria: z.array(criterionSchema) }),
});

export type SimulationInput = z.infer<typeof simulationInputSchema>;

export function computeSimulation(raw: unknown): SimulationResult | null {
  const parsed = simulationInputSchema.safeParse(raw);
  if (!parsed.success) return null;

  const memory = parsed.data;

  const totalWeight = memory.tender.criteria.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight <= 0) return null;

  const criteria: CriterionScore[] = memory.tender.criteria.map((criterion) => {
    const linked = memory.sections.filter((s) => s.criterionId === criterion.id);
    const done = linked.filter((s) => s.content.trim().length > 0).length;
    const completion = linked.length > 0 ? done / linked.length : 0;
    return {
      id: criterion.id,
      title: criterion.title,
      weight: criterion.weight,
      sectionsTotal: linked.length,
      sectionsDone: done,
      completion,
      weightedPoints: (criterion.weight / totalWeight) * completion * 100,
    };
  });

  const score100 =
    Math.round(criteria.reduce((sum, c) => sum + c.weightedPoints, 0) * 10) / 10;

  return {
    memoryId: memory.id,
    memoryTitle: memory.title,
    tenderId: memory.tenderId,
    tenderTitle: memory.tenderTitle,
    criteria,
    score100,
    score20: Math.round((score100 / 5) * 10) / 10,
  };
}
