import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || id.startsWith("temp-") || id.startsWith("draft-")) {
      return NextResponse.json(
        { error: "Identifiant de section invalide." },
        { status: 400 }
      );
    }

    const section = await prisma.memorySection.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!section) {
      return NextResponse.json(
        { error: "Section introuvable." },
        { status: 404 }
      );
    }

    await prisma.memorySection.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/memory/sections/[id]] DELETE error:", error);
    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500 }
    );
  }
}
