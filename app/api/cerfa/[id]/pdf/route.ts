import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderCerfaPdf, normalizeCerfaPayload } from "@/lib/cerfa/pdf";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || id.trim().length === 0) {
      return NextResponse.json({ error: "L'identifiant du document est requis." }, { status: 400 });
    }

    const document = await prisma.cerfaDocument.findUnique({ where: { id } });
    if (!document) {
      return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
    }

    let raw: unknown;
    try {
      raw = JSON.parse(document.payload);
    } catch {
      return NextResponse.json({ error: "Contenu du document illisible." }, { status: 422 });
    }

    const normalized = normalizeCerfaPayload(raw, document.formNumber);

    const bytes = await renderCerfaPdf(normalized);
    const fileUrl = `/api/cerfa/${document.id}/pdf`;

    if (document.fileUrl !== fileUrl) {
      await prisma.cerfaDocument.update({
        where: { id: document.id },
        data: { fileUrl },
      });
    }

    const fileName = `${document.formNumber}-${document.id.slice(0, 8)}.pdf`;
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[API/cerfa/pdf] GET error:", error);
    return NextResponse.json(
      { error: "Le document ne peut pas être généré (contenu invalide)." },
      { status: 422 }
    );
  }
}
