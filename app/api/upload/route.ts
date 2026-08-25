import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { limitOr429 } from "@/lib/ratelimit";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_DCE_BYTES = 25 * 1024 * 1024;

function detectMagic(bytes: Uint8Array): "pdf" | "zip" | null {
  if (bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d) {
    return "pdf";
  }
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07)) {
    return "zip";
  }
  return null;
}

export async function POST(request: NextRequest) {
  const limited = limitOr429(request, "upload", 10, 60_000);
  if (limited) return limited;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
    }

    if (file.size > MAX_DCE_BYTES) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (max 25 Mo)." },
        { status: 413 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Fichier vide." }, { status: 400 });
    }

    // Content-Type and extension are client-declared and untrustworthy:
    // validate the actual magic bytes instead.
    const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
    const kind = detectMagic(header);

    if (!kind) {
      return NextResponse.json(
        { error: "Format non supporté (PDF ou ZIP réels uniquement, vérifiés par signature)." },
        { status: 415 }
      );
    }

    const fileName = `${randomUUID()}.${kind}`;
    // Volume montable en prod (Docker/VPS) : UPLOAD_DIR=/data/uploads
    const uploadDir =
      process.env.UPLOAD_DIR ?? path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), Buffer.from(await file.arrayBuffer()));

    return NextResponse.json({ url: `/uploads/${fileName}`, name: file.name });
  } catch (error) {
    console.error("[API/upload] POST error:", error);
    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500 }
    );
  }
}
