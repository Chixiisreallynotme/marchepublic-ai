import { NextRequest, NextResponse } from "next/server";

// Session locale par token : ACCESS_TOKEN dans .env définit le jeton unique.
// Sans ACCESS_TOKEN, l'app reste ouverte (dev). Le cookie httpOnly mp_session
// porte le token après POST /api/auth/login.
const PUBLIC_PATHS = ["/login", "/api/auth", "/api/health", "/robots.txt", "/sitemap.xml"];

export function middleware(request: NextRequest) {
  const accessToken = process.env.ACCESS_TOKEN;
  if (!accessToken) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Comparaison directe volontaire (jeton local mono-utilisateur, pas un
  // secret multi-tenant exposé à l'énumération en ligne).
  const session = request.cookies.get("mp_session")?.value;
  if (session === accessToken) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = `next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
