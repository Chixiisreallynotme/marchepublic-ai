import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { PDFFont, PDFPage } from "pdf-lib";
import type { CerfaDocumentInput, DC1Input, DC2Input } from "@/lib/schemas/cerfa";

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 56;
const INK = rgb(0.06, 0.09, 0.15);
const MUTED = rgb(0.42, 0.47, 0.55);
const ACCENT = rgb(0.15, 0.28, 0.9);
const RULE = rgb(0.85, 0.88, 0.93);

type Line = { label?: string; value?: string; gapAfter?: number };

class Doc {
  private page!: PDFPage;
  private y = A4[1] - MARGIN;
  constructor(
    private readonly pdf: PDFDocument,
    private readonly regular: PDFFont,
    private readonly bold: PDFFont,
  ) {
    this.newPage();
  }

  newPage() {
    this.page = this.pdf.addPage(A4);
    this.y = A4[1] - MARGIN;
  }

  ensure(space: number) {
    if (this.y - space < MARGIN) this.newPage();
  }

  header(title: string, subtitle: string) {
    this.ensure(90);
    this.page.drawRectangle({
      x: 0, y: A4[1] - 6, width: A4[0], height: 6,
      color: ACCENT,
    });
    this.text("RÉPUBLIQUE FRANÇAISE", { font: this.bold, size: 9, color: MUTED });
    this.y -= 14;
    this.text(title, { font: this.bold, size: 16 });
    this.y -= 16;
    this.text(subtitle, { size: 9.5, color: MUTED });
    this.rule(18);
  }

  section(title: string) {
    this.ensure(40);
    this.y -= 10;
    this.text(title.toUpperCase(), { font: this.bold, size: 9.5, color: ACCENT });
    this.y -= 4;
    this.rule(10);
  }

  rule(gap = 12) {
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: A4[0] - MARGIN, y: this.y },
      thickness: 0.7,
      color: RULE,
    });
    this.y -= gap;
  }

  text(value: string, opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; x?: number } = {}) {
    const size = opts.size ?? 10;
    const lines = wrap(value, opts.font ?? this.regular, size, A4[0] - MARGIN * 2);
    for (const line of lines) {
      this.page.drawText(line, {
        x: opts.x ?? MARGIN,
        y: this.y,
        size,
        font: opts.font ?? this.regular,
        color: opts.color ?? INK,
      });
      this.y -= size * 1.45;
    }
  }

  fields(lines: Line[]) {
    for (const line of lines) {
      if (!line.value && !line.label) continue;
      this.ensure(20);
      if (line.label) {
        this.text(line.label, { size: 8.5, color: MUTED });
      }
      this.text(line.value ?? "—", { size: 10.5 });
      if (line.gapAfter) this.y -= line.gapAfter;
    }
  }

  footer(formLabel: string) {
    for (const page of this.pdf.getPages()) {
      page.drawText(`${formLabel} · MarchéPublic.ai · Document généré le ${new Date().toLocaleDateString("fr-FR")}`, {
        x: MARGIN,
        y: 28,
        size: 7.5,
        font: this.regular,
        color: MUTED,
      });
    }
  }
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function addressLine(a: { address?: string; postalCode?: string; city?: string }): string {
  return [a.address, [a.postalCode, a.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}

type RawRecord = Record<string, unknown>;

function str(raw: RawRecord, key: string): string | undefined {
  const value = raw[key];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

/**
 * Maps legacy flat payloads (pre-schema era, e.g. seeded documents) onto the
 * current discriminated union so the renderer can print every stored document.
 */
export function normalizeCerfaPayload(raw: unknown, formNumber: string): CerfaDocumentInput {
  if (
    raw &&
    typeof raw === "object" &&
    ("formType" in raw || "formtype" in raw) &&
    typeof (raw as RawRecord).formType === "string"
  ) {
    return raw as CerfaDocumentInput;
  }

  const legacy = (raw ?? {}) as RawRecord;
  const formType =
    formNumber === "DC1" || formNumber === "DC2" ? formNumber : "DC1";

  const candidateBase = {
    denomination:
      ((legacy.candidate as RawRecord | undefined)?.denomination as string) ??
      str(legacy, "raisonSociale") ??
      "Candidat",
    siren: str(legacy, "siren"),
    siret: str(legacy, "siretSiege") ?? str(legacy, "siret"),
    legalForm: str(legacy, "formeJuridique"),
    activityCode: str(legacy, "codeAPE"),
    address: str(legacy, "adresse"),
    postalCode: str(legacy, "codePostal"),
    city: str(legacy, "ville"),
    email: str((legacy.contact as RawRecord | undefined) ?? {}, "email"),
    phone: str((legacy.contact as RawRecord | undefined) ?? {}, "telephone"),
  };

  const representant = legacy.representantLegal as RawRecord | undefined;
  const signataireLegacy = str(legacy, "signataire");

  const signatory = {
    firstName:
      (str(representant ?? {}, "prenom") ?? signataireLegacy?.split(" ")[1] ?? signataireLegacy?.split(" ")[0]) || "—",
    lastName:
      (str(representant ?? {}, "nom") ?? signataireLegacy?.split(" ")[0]) || "—",
    role:
      (str(representant ?? {}, "fonction") ?? str(legacy, "qualiteSignataire")) ||
      "Représentant légal",
  };

  if (formType === "DC2") {
    const profCap = legacy.capacitesProfessionnelles as RawRecord | undefined;
    const techCap = legacy.capacitesTechniques as RawRecord | undefined;
    return {
      formType: "DC2",
      tenderReference: str(legacy, "tenderReference") ?? "Consultation",
      buyerName: str(legacy, "buyerName") ?? "Acheteur public",
      candidate: { ...candidateBase, isGroup: false },
      capacity: {
        legal: [
          {
            description:
              str(profCap ?? {}, "inscriptionRegistre") ?? "Inscription au registre du commerce",
            evidence: str(profCap ?? {}, "numeroInscription"),
          },
        ],
        technical: [
          {
            description: str(profCap ?? {}, "moyensHumains") ?? "Moyens humains dédiés",
            evidence: undefined,
          },
          {
            description: str(profCap ?? {}, "moyensMateriels") ?? "Moyens matériels",
            evidence: undefined,
          },
        ],
        financial: [
          {
            description:
              str(profCap ?? {}, "chiffreAffaires") ?? "Chiffre d'affaires des derniers exercices",
            evidence: undefined,
          },
        ],
      },
      signatory,
      declarationDate: new Date(),
    } satisfies DC2Input;
  }

  return {
    formType: "DC1",
    tenderReference: str(legacy, "tenderReference") ?? "Consultation",
    buyerName: str(legacy, "buyerName") ?? "Acheteur public",
    buyerAddress: {},
    candidate: { ...candidateBase, isGroup: false },
    representative: representant
      ? {
          firstName: str(representant, "prenom") ?? "—",
          lastName: str(representant, "nom") ?? "—",
          role: str(representant, "fonction") ?? "Représentant légal",
          email: candidateBase.email ?? "contact@exemple.fr",
          phone: candidateBase.phone,
        }
      : undefined,
    signatory,
    declarationDate: new Date(),
  } satisfies DC1Input;
}

export async function renderCerfaPdf(input: CerfaDocumentInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  if (input.formType === "DC2") renderDc2(pdf, regular, bold, input as DC2Input);
  else renderDc1(pdf, regular, bold, input as DC1Input);

  return pdf.save();
}

function renderDc1(pdf: PDFDocument, regular: PDFFont, bold: PDFFont, d: DC1Input) {
  const doc = new Doc(pdf, regular, bold);
  doc.header("Lettre de candidature — DC1", "Cerfa n° 11197*05");
  doc.fields([
    { label: "Référence de la consultation", value: d.tenderReference },
    { label: "Acheteur public", value: d.buyerName },
  ]);

  doc.section("Identification du candidat");
  doc.fields([
    { label: "Dénomination sociale", value: d.candidate?.denomination ?? "Candidat" },
    { label: "Forme juridique", value: d.candidate.legalForm },
    { label: "SIREN", value: d.candidate?.siren },
    { label: "SIRET", value: d.candidate?.siret },
    { label: "Code activité (APE)", value: d.candidate?.activityCode },
    { label: "Adresse du siège", value: addressLine(d.candidate ?? {}) },
    { label: "Contact", value: [d.candidate?.email, d.candidate?.phone].filter(Boolean).join(" · ") },
  ]);

  if (d.representative) {
    doc.section("Représentant habilité");
    doc.fields([
      { label: "Nom et prénom", value: `${d.representative.lastName} ${d.representative.firstName}` },
      { label: "Qualité", value: d.representative.role },
      { label: "Coordonnées", value: [d.representative.email, d.representative.phone].filter(Boolean).join(" · ") },
    ]);
  }

  doc.section("Signature");
  doc.fields([
    { label: "Fait à / le", value: `${d.declarationDate?.toLocaleDateString("fr-FR") ?? new Date().toLocaleDateString("fr-FR")} — Date et signature du candidat` },
    { label: "Signataire", value: `${d.signatory.firstName} ${d.signatory.lastName}` },
    { label: "Qualité", value: d.signatory.role },
  ]);

  doc.footer("DC1 · Cerfa 11197*05");
}

function renderDc2(pdf: PDFDocument, regular: PDFFont, bold: PDFFont, d: DC2Input) {
  const doc = new Doc(pdf, regular, bold);
  doc.header("Déclaration du candidat — DC2", "Cerfa n° 11207*08");
  doc.fields([
    { label: "Référence de la consultation", value: d.tenderReference },
    { label: "Acheteur public", value: d.buyerName },
  ]);

  doc.section("Renseignements généraux");
  doc.fields([
    { label: "Dénomination sociale", value: d.candidate?.denomination ?? "Candidat" },
    { label: "Forme juridique", value: d.candidate?.legalForm },
    { label: "SIREN", value: d.candidate?.siren },
    { label: "Adresse du siège", value: addressLine(d.candidate ?? {}) },
    { label: "Contact", value: [d.candidate?.email, d.candidate?.phone].filter(Boolean).join(" · ") },
  ]);

  const cap = d.capacity;
  if (cap) {
    if (cap.legal?.length) {
      doc.section("Capacités juridiques");
      cap.legal.forEach((item, i) => {
        doc.fields([{ label: `${i + 1}.`, value: [item.description, item.evidence].filter(Boolean).join(" — ") }]);
      });
    }
    if (cap.technical?.length) {
      doc.section("Capacités techniques et professionnelles");
      cap.technical.forEach((item, i) => {
        doc.fields([{ label: `${i + 1}.`, value: [item.description, item.evidence].filter(Boolean).join(" — ") }]);
      });
    }
    if (cap.financial?.length) {
      doc.section("Capacités financières");
      cap.financial.forEach((item, i) => {
        doc.fields([{ label: `${i + 1}.`, value: [item.description, item.evidence].filter(Boolean).join(" — ") }]);
      });
    }
  }

  doc.section("Attestations sur l'honneur");
  doc.text(
    "Le candidat atteste qu'il n'entre dans aucun des cas d'exclusion mentionnés aux articles L. 214-1 à L. 214-4 du Code de la commande publique, et que les renseignements déclarés sont exacts.",
    { size: 9.5, color: MUTED }
  );
  doc.rule(6);

  doc.section("Signature");
  doc.fields([
    { label: "Fait à / le", value: d.declarationDate?.toLocaleDateString("fr-FR") ?? new Date().toLocaleDateString("fr-FR") },
    { label: "Signataire", value: `${d.signatory.firstName} ${d.signatory.lastName}` },
    { label: "Qualité", value: d.signatory.role },
  ]);

  doc.footer("DC2 · Cerfa 11207*08");
}
