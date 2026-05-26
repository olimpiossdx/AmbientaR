/** Slugs válidos para templates DOCX em Configurações (espelha template-config). */
export const DOCX_TEMPLATE_SLUGS = [
  "rca",
  "ptrf",
  "prada",
  "pia",
  "eia-rima",
  "las-ras",
  "pca",
  "pea",
  "reserva-legal",
  "fauna",
  "outorgas",
  "barragens",
] as const;

export type DocxTemplateSlug = (typeof DOCX_TEMPLATE_SLUGS)[number];

export type DocxTemplateEntry = {
  url: string;
  fileName: string;
};

/** Mapa slug → metadados do template enviado ao Storage. */
export type DocxTemplatesState = Partial<
  Record<DocxTemplateSlug, DocxTemplateEntry>
>;

/**
 * Converte tipo de estudo do laudo para slug de template (mesma lógica do gerador DOCX).
 */
export function tipoEstudoToTemplateSlug(tipoEstudo: string): string {
  const normalized = tipoEstudo.toLowerCase().replace(/[^a-z0-9-]/g, "");
  const slugMap: Record<string, string> = {
    rca: "rca",
    pia: "pia",
    pca: "pca",
    prada: "prada",
    ptrf: "ptrf",
    eiarima: "eia-rima",
    lasras: "las-ras",
    reanalise: "rca",
    inventarioflorestal: "fauna",
    fauna: "fauna",
    outorgas: "outorgas",
    educacaoambiental: "pea",
    relatoriodiverso: "rca",
    outro: "rca",
  };
  return slugMap[normalized] ?? (normalized || "rca");
}
