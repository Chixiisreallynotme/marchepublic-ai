import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import HomePage from "@/app/page";
import RootLayout from "@/app/layout";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

afterEach(() => {
  cleanup();
});

describe("RootLayout", () => {
  function renderLayout() {
    return render(
      <RootLayout>
        <div data-testid="test-content">Contenu de test</div>
      </RootLayout>
    );
  }

  it("renders the main landmark wrapping children", () => {
    renderLayout();

    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
    expect(main).toContainElement(screen.getByTestId("test-content"));
  });

  it("renders test-content in the body", () => {
    renderLayout();

    // React 19 adopts the real <body> element of the document.
    const content = screen.getByTestId("test-content");
    expect(document.body).toContainElement(content);
  });

  it("renders the navbar and footer landmarks", () => {
    renderLayout();

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("sets lang='fr' on the html element", () => {
    renderLayout();

    // React 19 adopts the real <html> element of the document.
    expect(document.documentElement).toHaveAttribute("lang", "fr");
  });
});

describe("Navbar", () => {
  const NAV_LABELS = [
    "Appels d'offres",
    "Mémoires Techniques",
    "CERFA",
    "Open Data Sirene",
    "Simulation",
  ];

  it("renders the brand link", () => {
    render(<Navbar />);

    expect(screen.getByRole("link", { name: "MarchéPublic.ai — Accueil" })).toBeInTheDocument();
  });

  it("renders every navigation link inside the nav landmark", () => {
    render(<Navbar />);

    const nav = within(
      screen.getByRole("navigation", { name: /navigation principale/i })
    );
    for (const label of NAV_LABELS) {
      expect(nav.getByRole("link", { name: label })).toBeInTheDocument();
    }
    expect(
      nav.getByRole("link", { name: /démarrer maintenant/i })
    ).toBeInTheDocument();
  });

  it("renders a toggle button for the mobile menu", () => {
    render(<Navbar />);

    expect(
      screen.getByRole("button", { name: /ouvrir le menu/i })
    ).toBeInTheDocument();
  });
});

describe("Footer", () => {
  it("renders as a contentinfo landmark", () => {
    render(<Footer />);

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("renders legal and status sections", () => {
    render(<Footer />);

    expect(
      screen.getByRole("heading", { name: /informations légales/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /état des services/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /mentions légales/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/RGPD/i)).toBeInTheDocument();
  });
});

describe("HomePage", () => {
  const FEATURE_TITLES = [
    "Appels d'offres",
    "Mémoires Techniques",
    "Documents CERFA",
    "Open Data Sirene",
    "Simulation",
  ];

  it("renders the hero heading and primary CTA", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /marchés publics/i
    );
    expect(
      screen.getByRole("link", { name: /commencer gratuitement/i })
    ).toBeInTheDocument();
  });

  it("renders the features section with one card per feature", () => {
    render(<HomePage />);

    const features = screen.getByRole("region", {
      name: /fonctionnalités de la plateforme/i,
    });
    expect(
      within(features).getAllByRole("heading", { level: 3 })
    ).toHaveLength(FEATURE_TITLES.length);
    for (const title of FEATURE_TITLES) {
      expect(
        within(features).getByRole("heading", { name: title })
      ).toBeInTheDocument();
    }
  });
});
