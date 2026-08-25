import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST as loginPost } from "@/app/api/auth/login/route";

function loginRequest(token: string, next = "/"): NextRequest {
  const body = new URLSearchParams({ token, next });
  return new NextRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

const PREV_TOKEN = process.env.ACCESS_TOKEN;

afterEach(() => {
  if (PREV_TOKEN === undefined) delete process.env.ACCESS_TOKEN;
  else process.env.ACCESS_TOKEN = PREV_TOKEN;
});

describe("POST /api/auth/login", () => {
  it("redirige vers /login?error=1 avec un mauvais token (aucun cookie)", async () => {
    process.env.ACCESS_TOKEN = "secret-local-token";
    const res = await loginPost(loginRequest("mauvais-token"));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("/login?error=1");
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("pose le cookie httpOnly et redirige vers la page demandée avec le bon token", async () => {
    process.env.ACCESS_TOKEN = "secret-local-token";
    const res = await loginPost(loginRequest("secret-local-token", "/tenders"));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("/tenders");
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("mp_session=secret-local-token");
    expect(cookie).toMatch(/httponly/i);
    expect(cookie).toMatch(/samesite=lax/i);
  });

  it("neutralise les open redirects (//evil.com → /)", async () => {
    process.env.ACCESS_TOKEN = "secret-local-token";
    const res = await loginPost(
      loginRequest("secret-local-token", "//evil.com/steal")
    );
    const location = res.headers.get("location") ?? "";
    expect(location).not.toContain("evil.com");
    expect(location).toMatch(/\/$/);
  });

  it("refuse toute connexion si ACCESS_TOKEN n'est pas configuré", async () => {
    delete process.env.ACCESS_TOKEN;
    const res = await loginPost(loginRequest(""));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("/login?error=1");
  });
});
