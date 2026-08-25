import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { GET as uploadsGet } from "@/app/uploads/[file]/route";

function req(): NextRequest {
  return new NextRequest("http://localhost:3000/uploads/x");
}

let tmpDir: string | null = null;
const PREV_UPLOAD_DIR = process.env.UPLOAD_DIR;

afterEach(async () => {
  if (tmpDir) {
    await rm(tmpDir, { recursive: true, force: true });
    tmpDir = null;
  }
  if (PREV_UPLOAD_DIR === undefined) delete process.env.UPLOAD_DIR;
  else process.env.UPLOAD_DIR = PREV_UPLOAD_DIR;
});

describe("GET /uploads/[file]", () => {
  const UUID_PDF = "0c0ac6b2-6394-4785-9faf-7f93d920adfb.pdf";

  it("refuse tout nom non-UUID (traversal exclue) (404)", async () => {
    for (const name of ["../../.env", "a.pdf", "x".repeat(300)]) {
      const res = await uploadsGet(req(), {
        params: Promise.resolve({ file: name }),
      });
      expect(res.status).toBe(404);
    }
  });

  it("sert un PDF existant avec le bon Content-Type (200)", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "uploads-test-"));
    process.env.UPLOAD_DIR = tmpDir;
    await writeFile(
      path.join(tmpDir, UUID_PDF),
      Buffer.from("%PDF-1.4 test")
    );

    const res = await uploadsGet(req(), {
      params: Promise.resolve({ file: UUID_PDF }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(Buffer.from(await res.arrayBuffer()).toString()).toMatch(/^%PDF/);
  });

  it("répond 404 quand le fichier n'existe pas", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "uploads-test-"));
    process.env.UPLOAD_DIR = tmpDir;

    const res = await uploadsGet(req(), {
      params: Promise.resolve({
        file: "0c0ac6b2-6394-4785-9faf-7f93d920adfb.zip",
      }),
    });
    expect(res.status).toBe(404);
  });
});
