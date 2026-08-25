import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function POST(request: NextRequest) {
  const expected = process.env.ACCESS_TOKEN;
  const form = await request.formData();
  const token = String(form.get("token") ?? "");

  const rawNext = String(form.get("next") ?? "/");
  const nextPath =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (!expected || !safeEqual(token, expected)) {
    return NextResponse.redirect(new URL("/login?error=1", request.url), 303);
  }

  const res = NextResponse.redirect(new URL(nextPath, request.url), 303);
  res.cookies.set("mp_session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
