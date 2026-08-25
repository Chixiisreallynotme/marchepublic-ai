import type { Metadata } from "next";
import { Inter, Geist_Mono, Instrument_Serif } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MarchéPublic.ai — L'IA au service de vos marchés publics",
    template: "%s | MarchéPublic.ai",
  },
  description:
    "Plateforme d'assistance IA pour les marchés publics français : appels d'offres, mémoires techniques, documents CERFA et données Sirene.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: "MarchéPublic.ai",
    title: "MarchéPublic.ai — L'IA au service de vos marchés publics",
    description:
      "Structurez vos appels d'offres, rédigez vos mémoires techniques critère par critère et générez vos documents CERFA pré-remplis.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MarchéPublic.ai",
    description:
      "Appels d'offres, mémoires techniques et CERFA — l'IA au service des marchés publics.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${inter.variable} ${geistMono.variable} ${instrumentSerif.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
