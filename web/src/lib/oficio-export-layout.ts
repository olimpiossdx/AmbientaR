import type { Oficio } from "@/lib/types";
import { buildOficioConsolidatedText } from "@/lib/oficio-format";

/** Texto consolidado para exportação (usa data de conclusão quando aprovado). */
export function getOficioConsolidatedTextForExport(oficio: Oficio): string {
  return buildOficioConsolidatedText({
    ...oficio,
    dataEmissao:
      oficio.status === "Concluído"
        ? oficio.completedAt || oficio.dataEmissao
        : oficio.dataEmissao,
  });
}

export function getOficioExportBaseName(oficio: Oficio): string {
  const num = (oficio.oficioNumber || "rascunho").replace(/\//g, "-");
  const subject = (oficio.subject || "oficio")
    .slice(0, 48)
    .replace(/[<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, "_")
    .trim();
  return `oficio_${num}_${subject || "documento"}`;
}

/** Regras de alinhamento do corpo do ofício (PDF e DOCX). */

export function isOficioOpeningMetadata(section: string): boolean {
  const t = section.trim();
  return (
    /^OF\/PIMENTA/i.test(t) ||
    /^Referente:/i.test(t) ||
    /^Processo\s/i.test(t) ||
    /^Referência:/i.test(t) ||
    /^Assunto:/i.test(t) ||
    /^Prezado/i.test(t)
  );
}

/** Blocos que permanecem alinhados à esquerda (cabeçalho, metadados, assinatura). */
export function shouldLeftAlignSection(section: string): boolean {
  const t = section.trim();
  if (!t) return true;
  if (/^OF\/PIMENTA/i.test(t)) return true;
  if (/^Referente:/i.test(t)) return true;
  if (/^Processo\s/i.test(t)) return true;
  if (/^Referência:/i.test(t)) return true;
  if (/^Assunto:/i.test(t)) return true;
  if (/^Prezado/i.test(t)) return true;
  if (/^Atenciosamente/i.test(t)) return true;
  if (/^_{3,}/.test(t)) return true;
  if (/^p\/p\s/i.test(t)) return true;
  if (/^Anexo/i.test(t)) return true;
  if (/^Por fim,/i.test(t)) return true;
  if (/\d{4}$/.test(t) && t.includes(" de ")) return true;
  if (t.length < 72 && !/\bCONSIDERANDO\b/.test(t)) {
    const lineCount = t.split("\n").length;
    if (lineCount <= 2 && !t.includes(". ")) return true;
  }
  return false;
}

export function splitOficioContentSections(content: string): string[] {
  return content
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
