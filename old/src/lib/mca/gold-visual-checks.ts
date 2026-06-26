import type { FeatureCollection } from "geojson";
import type { GoldManifest } from "./gold-manifest";
import type { McaProjectDoc } from "./types";

export type GoldVisualCheck = {
  id: string;
  label: string;
  pass: boolean;
  detail: string;
  /** Requer comparação manual com PDF Pimenta de referência. */
  manual?: boolean;
};

const CHECK_LABELS: Record<string, string> = {
  multi_matricula: "Múltiplas matrículas no quadro",
  rl_compensada: "RL com glebas compensadas",
  confrontantes: "Layer FUND_CONFRONTANTE",
  silos_pista_pouso: "Infra silos / pista",
  legenda_reservas_legais: "Tabela reserva legal",
  grade_utm: "Grade UTM no mapa (jsPDF)",
  carimbo_crea: "CREA / responsável técnico",
  quadro_informacoes: "Quadro de informações",
  north_arrow: "Seta norte",
  scale_bar: "Barra de escala",
};

function layerFeatureCount(
  layers: Map<string, FeatureCollection> | Record<string, FeatureCollection>,
  key: string,
): number {
  const fc =
    layers instanceof Map ? layers.get(key) : (layers as Record<string, FeatureCollection>)[key];
  return fc?.features?.length ?? 0;
}

function hasLayer(
  layers: Map<string, FeatureCollection> | Record<string, FeatureCollection>,
  key: string,
): boolean {
  return layerFeatureCount(layers, key) > 0;
}

/** Checks automáticos alinhados ao visualChecklist do manifest ouro. */
export function runGoldVisualChecks(params: {
  project: McaProjectDoc;
  layers: Map<string, FeatureCollection> | Record<string, FeatureCollection>;
  pdf: Buffer;
  manifest: GoldManifest;
  pdfText?: string;
}): GoldVisualCheck[] {
  const { project, layers, pdf, manifest, pdfText } = params;
  const text = pdfText ?? "";
  const checks: GoldVisualCheck[] = [];

  const checklist = manifest.visualChecklist ?? [];

  for (const id of checklist) {
    const label = CHECK_LABELS[id] ?? id;
    switch (id) {
      case "multi_matricula": {
        const n = project.meta.matriculas?.length ?? 0;
        checks.push({
          id,
          label,
          pass: n >= 2,
          detail: `${n} matrícula(s)`,
        });
        break;
      }
      case "rl_compensada": {
        const rlRows = project.tables?.rl ?? [];
        const compensated = rlRows.filter((r) => r.compensada).length;
        checks.push({
          id,
          label,
          pass: compensated > 0,
          detail: `${compensated} gleba(s) compensada(s) · ${rlRows.length} linhas RL`,
        });
        break;
      }
      case "confrontantes":
        checks.push({
          id,
          label,
          pass: hasLayer(layers, "FUND_CONFRONTANTE"),
          detail: hasLayer(layers, "FUND_CONFRONTANTE")
            ? `${layerFeatureCount(layers, "FUND_CONFRONTANTE")} feição(ões)`
            : "FUND_CONFRONTANTE em falta",
        });
        break;
      case "silos_pista_pouso": {
        const silos = hasLayer(layers, "INFRA_SILOS");
        const pista = hasLayer(layers, "INFRA_PISTA");
        checks.push({
          id,
          label,
          pass: silos || pista,
          detail: `SILOS ${silos ? "sim" : "não"} · PISTA ${pista ? "sim" : "não"}`,
        });
        break;
      }
      case "legenda_reservas_legais":
        checks.push({
          id,
          label,
          pass: (project.tables?.rl?.length ?? 0) > 0,
          detail: `${project.tables?.rl?.length ?? 0} linhas na tabela RL`,
        });
        break;
      case "grade_utm":
        checks.push({
          id,
          label,
          pass: Boolean(project.layoutJson?.version === 2),
          detail: "Layout JSON v2 (grade no jsPDF via map-preview-pdf)",
          manual: true,
        });
        break;
      case "carimbo_crea": {
        const crea = project.meta.crea?.trim();
        const inPdf = crea ? text.includes(crea) : false;
        checks.push({
          id,
          label,
          pass: Boolean(crea && (inPdf || !text)),
          detail: crea ? (text ? (inPdf ? `CREA ${crea} no PDF` : "CREA não encontrado no texto PDF") : `CREA ${crea} (meta)`) : "CREA em falta",
        });
        break;
      }
      case "quadro_informacoes": {
        const hasTable =
          text.includes("Propriedade") &&
          text.includes("Matrículas") &&
          text.includes("Uso e ocupação");
        checks.push({
          id,
          label,
          pass: hasTable || (!text && Boolean(project.tables?.uso?.length)),
          detail: text
            ? hasTable
              ? "Campos detectados no PDF"
              : "Quadro incompleto no texto extraído"
            : "Tabelas uso/APP presentes no projecto",
        });
        break;
      }
      case "north_arrow":
      case "scale_bar":
        checks.push({
          id,
          label,
          pass: pdf.length > 5000,
          detail: "Verificação automática limitada — comparar PDF com referência Pimenta",
          manual: true,
        });
        break;
      default:
        checks.push({
          id,
          label,
          pass: false,
          detail: "Checklist item sem verificador automático",
          manual: true,
        });
    }
  }

  checks.push({
    id: "pdf_size",
    label: "PDF E13 gerado",
    pass: pdf.length >= 5000,
    detail: `${pdf.length} bytes`,
  });

  if (manifest.expected?.pivoCountMin) {
    const pivo = layerFeatureCount(layers, "USO_PIVO");
    checks.push({
      id: "expected_pivo",
      label: `Pivôs (mín. ${manifest.expected.pivoCountMin})`,
      pass: pivo >= manifest.expected.pivoCountMin,
      detail: `${pivo} feição(ões) USO_PIVO · import DWG real para regressão plena`,
      manual: true,
    });
  }

  return checks;
}

export function goldVisualChecksPass(checks: GoldVisualCheck[]): boolean {
  const auto = checks.filter((c) => !c.manual);
  return auto.length > 0 && auto.every((c) => c.pass);
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const { text } = await parser.getText();
      return text ?? "";
    } finally {
      await parser.destroy();
    }
  } catch {
    return "";
  }
}
