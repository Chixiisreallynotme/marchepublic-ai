import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_DCE_BYTES = 25 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
]);

export async function POST(request: NextRequest) {
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

    const isPdfName = file.name.toLowerCase().endsWith(".pdf");
    const isZipName = /\.(zip|rar|7z)$/i.test(file.name);
    if (!ALLOWED_MIME.has(file.type) && !isPdfName && !isZipName) {
      return NextResponse.json(
        { error: "Format non supporté (PDF ou archive ZIP attendus)." },
        { status: 415 }
      );
    }

    const safeExt = isPdfName ? ".pdf" : ".zip";
    const fileName = `${randomUUID()}${safeExt}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
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
