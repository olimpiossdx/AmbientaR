"use client";

import type { Oficio } from "@/lib/types";
import type { BrandingImageUrls, BrandingPdfImages } from "@/lib/branding-pdf";
import {
  addJustifiedTextBlock,
  downloadJsPdf,
} from "@/lib/pdf-export-utils";
import {
  addBrandedPage,
  brandingUrlsFromLocal,
  createMmBrandedPdfSession,
  getContentBottomLimit,
  getContentStartY,
  reportBrandingPdfIssues,
  type MmBrandedPdfSession,
} from "@/lib/pdf-branding-layout";
import type { LocalBranding } from "@/hooks/use-local-branding";
import {
  getOficioConsolidatedTextForExport,
  getOficioExportBaseName,
  isOficioOpeningMetadata,
  shouldLeftAlignSection,
} from "@/lib/oficio-export-layout";

export {
  getOficioConsolidatedTextForExport,
  getOficioExportBaseName,
} from "@/lib/oficio-export-layout";

export function isOficioExportable(oficio: Oficio): boolean {
  return oficio.status === "Concluído" && Boolean(oficio.oficioNumber?.trim());
}

export type OficioExportBrandingOptions = {
  branding?: LocalBranding | BrandingImageUrls | null;
  pdfImages?: BrandingPdfImages | null;
};

const OFICIO_LINE_HEIGHT_MM = 6;
const OFICIO_PARAGRAPH_GAP_MM = 3;
/** Espaço extra após cada linha de metadado do topo (OF, Referente, Processo, Assunto, saudação). */
const OFICIO_METADATA_GAP_MM = 4.5;

function writeLeftLines(
  session: MmBrandedPdfSession,
  y: number,
  lines: string[],
): number {
  const { doc, margins, contentWidth } = session;
  const bottom = getContentBottomLimit(doc, session.branding);

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      y += OFICIO_METADATA_GAP_MM * 0.45;
      continue;
    }
    y = session.ensureSpace(y, OFICIO_LINE_HEIGHT_MM);
    const wrapped: string[] = doc.splitTextToSize(line, contentWidth);
    for (const w of wrapped) {
      if (y > bottom) {
        y = addBrandedPage(doc, session.branding);
      }
      doc.text(String(w), margins.left, y);
      y += OFICIO_LINE_HEIGHT_MM;
    }
  }
  return y;
}

function writeJustifiedSection(
  session: MmBrandedPdfSession,
  y: number,
  section: string,
): number {
  const { doc, margins, branding } = session;
  const bottom = getContentBottomLimit(doc, branding);
  const paragraphs = section
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  for (const para of paragraphs) {
    y = session.ensureSpace(y, OFICIO_LINE_HEIGHT_MM * 2);
    y = addJustifiedTextBlock(doc, para, y, {
      x: margins.left,
      maxWidth: session.contentWidth,
      lineHeight: OFICIO_LINE_HEIGHT_MM,
      contentBottomY: bottom,
      contentStartY: getContentStartY(branding),
      onNewPage: () => {
        addBrandedPage(doc, branding);
      },
    });
    y += OFICIO_PARAGRAPH_GAP_MM;
  }
  return y;
}

/** Gera PDF A4 com identidade visual (cabeçalho, marca d'água, rodapé) e corpo justificado. */
export async function exportOficioPdf(
  oficio: Oficio,
  textOrOptions?: string | (OficioExportBrandingOptions & { text?: string }),
): Promise<void> {
  const options =
    typeof textOrOptions === "string"
      ? { text: textOrOptions }
      : textOrOptions ?? {};
  const content = options.text ?? getOficioConsolidatedTextForExport(oficio);
  const urls = brandingUrlsFromLocal(options.branding ?? null);

  const session = await createMmBrandedPdfSession(
    urls,
    undefined,
    options.pdfImages ?? null,
  );
  reportBrandingPdfIssues(urls, session.branding.images);

  const { doc } = session;
  doc.setFont("times", "normal");
  doc.setFontSize(12);

  let y = session.startY;
  const sections = content.split(/\n\n+/);

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;
    if (shouldLeftAlignSection(trimmed)) {
      y = writeLeftLines(session, y, trimmed.split("\n"));
      y += isOficioOpeningMetadata(trimmed)
        ? OFICIO_METADATA_GAP_MM
        : OFICIO_PARAGRAPH_GAP_MM * 0.5;
    } else {
      y = writeJustifiedSection(session, y, trimmed);
    }
  }

  session.finalize();
  downloadJsPdf(doc, getOficioExportBaseName(oficio));
}

export { exportOficioDocx, exportOficioWord } from "@/lib/oficio-docx-export";
