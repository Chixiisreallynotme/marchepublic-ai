import { NextRequest, NextResponse } from "next/server";
import { generateCerfa } from "@/lib/actions/cerfa";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await generateCerfa(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, issues: result.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("[API/cerfa] POST error:", error);
    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500 }
    );
  }
}