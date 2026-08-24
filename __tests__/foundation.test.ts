import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { createElement as h } from "react";
import { render, screen } from "@testing-library/react";
import { PrismaClient } from "@prisma/client";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ROOT = path.resolve(__dirname, "..");

describe("Prisma schema", () => {
  const schemaPath = path.join(ROOT, "prisma", "schema.prisma");
  const schema = readFileSync(schemaPath, "utf-8");
  const MODELS = [
    "Organization",
    "Tender",
    "Criterion",
    "TechnicalMemory",
    "MemorySection",
    "CerfaDocument",
    "SireneCompany",
  ];

  it("uses the SQLite datasource", () => {
    expect(schema).toMatch(/datasource\s+db\s*{/);
    expect(schema).toContain('provider = "sqlite"');
    expect(schema).toContain('url      = env("DATABASE_URL")');
  });

  it.each(MODELS)("defines model %s", (model) => {
    expect(schema).toMatch(new RegExp(`model ${model}\\s*{`));
  });

  it("relates Tender to Criterion and TechnicalMemory", () => {
    expect(schema).toContain("criteria          Criterion[]");
    expect(schema).toContain("technicalMemories TechnicalMemory[]");
    expect(schema).toContain("sections         MemorySection[]");
    expect(schema).toContain("cerfaDocuments   CerfaDocument[]");
  });
});

describe("lib/prisma", () => {
  it("exports a PrismaClient instance", () => {
    expect(typeof PrismaClient).toBe("function");
    // instanceof is unreliable across the Prisma ESM boundary in vitest,
    // so we assert on the client's own API surface instead.
    expect(typeof prisma.$connect).toBe("function");
    expect(typeof prisma.$disconnect).toBe("function");
    expect(prisma.constructor.name).toMatch(/PrismaClient/i);
  });

  it("is a singleton across imports", async () => {
    const again = await import("@/lib/prisma");
    expect(again.prisma).toBe(prisma);
    expect(again.default).toBe(prisma);
  });
});

describe("cn utility", () => {
  it("joins class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("ignores falsy values and handles arrays/objects", () => {
    expect(cn("a", false && "b", undefined, null, ["c", "d"], { e: true })).toBe("a c d e");
  });

  it("resolves tailwind conflicts keeping the last one", () => {
    expect(cn("px-2 py-1", "p-3")).toBe("p-3");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });
});

describe("components", () => {
  it("Navbar renders MarchePublic.ai branding and navigation links", () => {
    render(h(Navbar));
    expect(screen.getByLabelText("MarchéPublic.ai — Accueil")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Appels d'offres" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mémoires Techniques" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "CERFA" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Data Sirene" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Simulation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ouvrir le menu" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Démarrer maintenant" }).length).toBeGreaterThan(0);
  });

  it("Footer renders République Française badge, legal links and status indicators", () => {
    render(h(Footer));
    expect(screen.getByText(/République Française/i)).toBeInTheDocument();
    expect(screen.getByText(/Liberté · Égalité · Fraternité/i)).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /Liens légaux/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Mentions légales/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Politique de confidentialité/i })).toBeInTheDocument();
    expect(screen.getByText(/API opérationnelle/i)).toBeInTheDocument();
    expect(screen.getByText(/Base Sirene synchronisée/i)).toBeInTheDocument();
  });
});

describe("app shell files", () => {
  it("has layout and page with hero content", () => {
    const layout = readFileSync(path.join(ROOT, "app", "layout.tsx"), "utf-8");
    expect(layout).toContain('<html lang="fr"');
    expect(layout).toContain("<Navbar />");
    expect(layout).toContain("<Footer />");

    const page = readFileSync(path.join(ROOT, "app", "page.tsx"), "utf-8");
    expect(page).toContain("marchés publics");

    expect(existsSync(path.join(ROOT, "app", "globals.css"))).toBe(true);
    expect(existsSync(path.join(ROOT, "tailwind.config.ts"))).toBe(true);
  });
});
