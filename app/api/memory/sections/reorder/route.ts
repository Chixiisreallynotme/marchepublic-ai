import { NextRequest, NextResponse } from "next/server";
import { reorderSections } from "@/lib/actions/memories";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await reorderSections(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, issues: result.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("[API/memory/sections/reorder] POST error:", error);
    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500 }
    );
  }
}