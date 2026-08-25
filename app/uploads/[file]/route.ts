import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

// Les fichiers uploadés ne sont pas servis par le dossier statique public/
// en production (next start fige public/ au build) : cette route sert les
// fichiers écrits par POST /api/upload depuis UPLOAD_DIR.
const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  zip: "application/zip",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;

  // Seuls les noms générés par POST /api/upload (UUID.pdf|zip) sont valides :
  // ce format exclut toute traversal de chemin.
  const match = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(pdf|zip)$/.exec(
    file
  );
  if (!match) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  const uploadDir =
    process.env.UPLOAD_DIR ?? path.join(process.cwd(), "public", "uploads");

  try {
    const data = await readFile(path.join(uploadDir, file));
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": CONTENT_TYPES[match[1]],
        "Content-Disposition": `inline; filename="${file}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }
}
