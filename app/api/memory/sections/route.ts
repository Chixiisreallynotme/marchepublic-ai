import { NextRequest, NextResponse } from "next/server";
import { createOrUpdateMemorySection } from "@/lib/actions/memories";

const MAX_SECTION_PAYLOAD_BYTES = 128 * 1024;

export async function POST(request: NextRequest) {
  try {
    if (Number(request.headers.get("content-length") ?? "0") > MAX_SECTION_PAYLOAD_BYTES) {
      return NextResponse.json({ error: "Payload trop volumineux." }, { status: 413 });
    }
    const body = await request.json();
    if (JSON.stringify(body).length > MAX_SECTION_PAYLOAD_BYTES) {
      return NextResponse.json({ error: "Payload trop volumineux." }, { status: 413 });
    }
    const result = await createOrUpdateMemorySection(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, issues: result.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("[API/memory/sections] POST error:", error);
    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500 }
    );
  }
}