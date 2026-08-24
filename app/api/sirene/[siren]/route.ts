import { NextRequest, NextResponse } from "next/server";
import { lookupSirene, getSireneCompany } from "@/lib/actions/sirene";
import { limitOr429 } from "@/lib/ratelimit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siren: string }> }
) {
  const limited = limitOr429(request, "sirene", 30, 60_000);
  if (limited) return limited;

  try {
    const { siren } = await params;

    if (!siren || siren.trim().length === 0) {
      return NextResponse.json(
        { error: "Le SIREN est requis." },
        { status: 400 }
      );
    }

    const result = await lookupSirene({ siren });

    if (!result.success) {
      const isFormat = (result.issues?.siren?.length ?? 0) > 0 || /invalide/i.test(result.error);
      return NextResponse.json(
        { error: result.error, issues: result.issues },
        { status: isFormat ? 400 : 404 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("[API/sirene] GET error:", error);
    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500 }
    );
  }
}