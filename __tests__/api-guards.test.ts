import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as cerfaPost } from "@/app/api/cerfa/route";
import { POST as reviewPost } from "@/app/api/simulation/review/route";

function jsonRequest(body: unknown, size = 0): NextRequest {
  return new NextRequest("http://localhost:3000/api/x", {
    method: "POST",
    headers: { "content-length": String(size || JSON.stringify(body).length) },
    body: JSON.stringify(body),
  });
}

describe("API /api/cerfa payload guard", () => {
  it("rejette un content-length au-delà de 64 Ko (413)", async () => {
    const req = jsonRequest({ big: "x" }, 65 * 1024);
    const res = await cerfaPost(req);
    expect(res.status).toBe(413);
  });

  it("rejette un body JSON dépassant 64 Ko après sérialisation (413)", async () => {
    const req = jsonRequest({ big: "x".repeat(70 * 1024) });
    const res = await cerfaPost(req);
    expect(res.status).toBe(413);
  });

  it("passe la garde pour un payload raisonnable (400 validation, pas 413)", async () => {
    const req = jsonRequest({ tenderId: "t", memoryId: "m", formType: "DC1", payload: {} });
    const res = await cerfaPost(req);
    expect(res.status).not.toBe(413);
  });
});

describe("API /api/simulation/review guards", () => {
  it("répond 503 sans LLM_API_KEY (aucune fuite de données vers un LLM)", async () => {
    const prev = process.env.LLM_API_KEY;
    delete process.env.LLM_API_KEY;
    try {
      const req = jsonRequest({ memoryId: "m1" });
      const res = await reviewPost(req);
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.code).toBe("MISSING_API_KEY");
    } finally {
      if (prev !== undefined) process.env.LLM_API_KEY = prev;
    }
  });

  it("rejette un content-length > 4 Ko (413)", async () => {
    const prev = process.env.LLM_API_KEY;
    process.env.LLM_API_KEY = "test-key-1234567890";
    try {
      const req = jsonRequest({ memoryId: "m1" }, 8192);
      const res = await reviewPost(req);
      expect(res.status).toBe(413);
    } finally {
      if (prev !== undefined) process.env.LLM_API_KEY = prev;
      else delete process.env.LLM_API_KEY;
    }
  });
});
