import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const reviewSchema = z.object({
  memoryId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const apiKey = process.env.LLM_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "LLM_API_KEY manquante. Renseignez LLM_API_KEY dans .env.local pour activer l'analyse IA.",
        code: "MISSING_API_KEY",
      },
      { status: 503 }
    );
  }

  if (Number(request.headers.get("content-length") ?? "0") > 4096) {
    return NextResponse.json({ error: "Payload trop volumineux." }, { status: 413 });
  }

  try {
    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "memoryId requis." }, { status: 400 });
    }

    const memory = await prisma.technicalMemory.findUnique({
      where: { id: parsed.data.memoryId },
      include: {
        tender: { include: { criteria: true } },
        sections: true,
      },
    });

    if (!memory) {
      return NextResponse.json({ error: "Mémoire introuvable." }, { status: 404 });
    }

    const totalWeight = memory.tender.criteria.reduce((s, c) => s + c.weight, 0) || 1;
    const breakdown = memory.tender.criteria.map((criterion) => {
      const linked = memory.sections.filter((s) => s.criterionId === criterion.id);
      const done = linked.filter((s) => s.content.trim().length > 0);
      const completion = linked.length ? done.length / linked.length : 0;
      return {
        titre: criterion.title,
        ponderation: `${Math.round((criterion.weight / totalWeight) * 100)}%`,
        completion: `${Math.round(completion * 100)}%`,
        extraits: done.slice(0, 2).map((s) => s.title).join(" ; ") || "(aucune section rédigée)",
      };
    });

    const baseUrl = (process.env.LLM_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
    const model = process.env.LLM_MODEL ?? "gpt-4o-mini";

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "Tu es un évaluateur de mémoires techniques pour des marchés publics français. " +
              "Analyse la complétude et la pertinence du mémoire par critère, identifie les angles morts " +
              "et propose 3 améliorations concrètes priorisées. Réponds en markdown concis (max 300 mots).",
          },
          {
            role: "user",
            content: `Consultation: ${memory.tender.title}\n\nDécomposition par critère:\n${breakdown
              .map(
                (b) =>
                  `- ${b.titre} (${b.ponderation}, complétion ${b.completion}) — sections: ${b.extraits}`
              )
              .join("\n")}\n\nRésumé du mémoire:\n${memory.summary ?? "(vide)"}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("[simulation/review] LLM error:", response.status, detail.slice(0, 300));
      return NextResponse.json(
        { error: `Le fournisseur IA a répondu ${response.status}.` },
        { status: 502 }
      );
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "Réponse IA vide." }, { status: 502 });
    }

    return NextResponse.json({ review: content });
  } catch (error) {
    console.error("[simulation/review] POST error:", error);
    return NextResponse.json({ error: "Une erreur interne est survenue." }, { status: 500 });
  }
}
