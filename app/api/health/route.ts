import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type CheckState = "ok" | "degraded" | "down";

async function checkDb(): Promise<CheckState> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return "ok";
  } catch {
    return "down";
  }
}

async function checkSirene(): Promise<CheckState> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      "https://recherche-entreprises.api.gouv.fr/search?q=552100554&page=1&per_page=1",
      { signal: controller.signal, headers: { Accept: "application/json" } }
    );
    clearTimeout(timer);
    return res.ok ? "ok" : "degraded";
  } catch {
    return "degraded";
  }
}

export async function GET() {
  const [db, sirene] = await Promise.all([checkDb(), checkSirene()]);

  const checks = {
    database: db,
    sireneRegistry: sirene,
    cerfaPdf: "ok" as CheckState, // générateur local pdf-lib, sans dépendance externe
  };

  const globalState: CheckState = db === "down" ? "down" : sirene === "down" ? "degraded" : "ok";

  return NextResponse.json(
    {
      status: globalState,
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: db === "down" ? 503 : 200 }
  );
}
