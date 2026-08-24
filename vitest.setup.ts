import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// next/font/google downloads and compiles fonts at build time and is not
// supported in jsdom. Mock every font export with a minimal shape.
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-sans", className: "", style: {} }),
  Geist_Mono: () => ({ variable: "--font-mono", className: "", style: {} }),
  Instrument_Serif: () => ({ variable: "--font-display", className: "", style: {} }),
}));

// Prisma engines must not spawn during unit tests. Under vitest's CJS/ESM
// interop, real PrismaClient instances also fail `instanceof` checks.
vi.mock("@prisma/client", () => {
  const makeDelegate = () =>
    new Proxy(
      {},
      {
        get: (_target, prop) => {
          if (prop === "then") return undefined;
          if (typeof prop === "string") {
            return vi.fn().mockResolvedValue([]);
          }
          return undefined;
        },
      }
    );

  class PrismaClient {
    $connect = vi.fn();
    $disconnect = vi.fn();
    $queryRaw = vi.fn();
    $executeRaw = vi.fn();
    $transaction = vi.fn();

    constructor() {
      return new Proxy(this, {
        get: (target, prop, receiver) => {
          if (Reflect.has(target, prop)) {
            return Reflect.get(target, prop, receiver);
          }
          if (typeof prop === "string" && /^[a-z]/.test(prop)) {
            return makeDelegate();
          }
          return undefined;
        },
      }) as PrismaClient;
    }
  }

  return { PrismaClient };
});;
