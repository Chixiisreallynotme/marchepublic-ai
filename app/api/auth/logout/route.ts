import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const res = NextResponse.redirect(new URL("/login", request.url));
  res.cookies.delete("mp_session");
  return res;
}
