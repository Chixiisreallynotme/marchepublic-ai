import { NextRequest, NextResponse } from "next/server";
import { generateCerfa } from "@/lib/actions/cerfa";
import { limitOr429 } from "@/lib/ratelimit";

const MAX_CERFA_PAYLOAD_BYTES = 64 * 1024;

export async function POST(request: NextRequest) {
  const limited = limitOr429(request, "cerfa", 20, 60_000);
  if (limited) return limited;

  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > MAX_CERFA_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: "Payload trop volumineux (max 64 Ko)." },
        { status: 413 }
      );
    }

    const body = await request.json();
    if (JSON.stringify(body).length > MAX_CERFA_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: "Payload trop volumineux (max 64 Ko)." },
        { status: 413 }
      );
    }

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