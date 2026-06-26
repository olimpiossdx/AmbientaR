import type { CarHistoricoAvaliacao } from "@/lib/geospatial/car-snapshot-compare";
import type {
  AlertaExtratoUnificado,
  ResultadoCriterio,
  ResultadoCriterioStatus,
  RiscoPorGeometria,
} from "@/lib/types/analise-socioambiental";
import type { ListasAgenteResult } from "@/lib/socioambiental/listas-agente-types";
import { SOCIOAMBIENTAL_CRITERIA_CATALOG } from "@/lib/socioambiental/socioambiental-criteria-catalog";
import { criterioResultadoFillColor } from "@/lib/socioambiental/criterio-resultado-display";
import {
  brandedPdfNewPage,
  writeBrandedPdfParagraph,
  writeBrandedPdfTitle,
} from "@/lib/ia-menu-branded-pdf";
import type { MmBrandedPdfSession } from "@/lib/pdf-branding-layout";

const RESULTADO_ORDER: Record<ResultadoCriterioStatus, number> = {
  Inapto: 0,
  Alerta: 1,
  Apto: 2,
  "Não Analisado": 3,
};

function worstResultado(
  a: ResultadoCriterioStatus,
  b: ResultadoCriterioStatus,
): ResultadoCriterioStatus {
  return RESULTADO_ORDER[a] <= RESULTADO_ORDER[b] ? a : b;
}

function catalogByLabel(label: string) {
  return SOCIOAMBIENTAL_CRITERIA_CATALOG.find((c) => c.label === label);
}

function mergeKey(tipoRisco: string, codigoAlerta: string): string {
  return `${tipoRisco}::${codigoAlerta}`;
}

function mergeKeyFromCriterio(criterio: ResultadoCriterio): string {
  const entry = catalogByLabel(criterio.criterio);
  const tipoRisco = entry?.label ?? criterio.criterio;
  const codigoAlerta = entry?.id ?? criterio.criterio;
  return mergeKey(tipoRisco, codigoAlerta);
}

function mergeKeyFromRiscoLayer(layerId: string, tipoRisco: string): string {
  const catalogMatch = SOCIOAMBIENTAL_CRITERIA_CATALOG.find(
    (c) => c.fonte.layerId === layerId,
  );
  if (catalogMatch) {
    return mergeKey(catalogMatch.label, catalogMatch.id);
  }
  return mergeKey(tipoRisco, layerId);
}

function upsertAlerta(
  map: Map<string, AlertaExtratoUnificado>,
  key: string,
  partial: Omit<AlertaExtratoUnificado, "geometrias"> & { geometrias?: string[] },
): void {
  const geoms = partial.geometrias ?? ["Imóvel rural"];
  const existing = map.get(key);
  if (!existing) {
    map.set(key, {
      ...partial,
      geometrias: [...new Set(geoms)],
    });
    return;
  }
  existing.resultado = worstResultado(existing.resultado, partial.resultado);
  for (const g of geoms) {
    if (!existing.geometrias.includes(g)) existing.geometrias.push(g);
  }
  if (
    partial.detalhe &&
    partial.detalhe !== "—" &&
    !existing.detalhe.includes(partial.detalhe)
  ) {
    existing.detalhe =
      existing.detalhe === "—"
        ? partial.detalhe
        : `${existing.detalhe}; ${partial.detalhe}`;
  }
}

export function mergeAlertasExtratoCompleto(params: {
  criteriosResultados: ResultadoCriterio[];
  riscoPorGeometria?: RiscoPorGeometria[];
  carHistorico?: CarHistoricoAvaliacao | null;
  listasAgente?: ListasAgenteResult | null;
  imovelRotulo?: string;
}): AlertaExtratoUnificado[] {
  const map = new Map<string, AlertaExtratoUnificado>();
  const imovel = params.imovelRotulo ?? "Imóvel rural";

  for (const c of params.criteriosResultados) {
    if (c.resultado === "Apto") continue;
    const entry = catalogByLabel(c.criterio);
    upsertAlerta(map, mergeKeyFromCriterio(c), {
      tipoRisco: entry?.label ?? c.criterio,
      codigoAlerta: entry?.id ?? c.criterio,
      resultado: c.resultado,
      detalhe: c.detalhe ?? "—",
      geometrias: [imovel],
      origem: entry?.tipoConsulta === "lista" ? "lista" : "criterio",
    });
  }

  for (const geometria of params.riscoPorGeometria ?? []) {
    for (const linha of geometria.linhas) {
      if (linha.resultado === "Apto") continue;
      const detalheParts: string[] = [];
      if (linha.sobreposicaoHa > 0.01) {
        detalheParts.push(
          `Sobreposição ${linha.sobreposicaoHa.toFixed(2)} ha (${linha.sobreposicaoPct.toFixed(1)}%)`,
        );
      }
      if (linha.proximidadeM != null && linha.proximidadeM > 0) {
        detalheParts.push(`Proximidade ${linha.proximidadeM} m`);
      }
      if (linha.bufferHa != null && linha.bufferHa > 0.01) {
        detalheParts.push(`Buffer ${linha.bufferHa.toFixed(2)} ha`);
      }
      upsertAlerta(
        map,
        mergeKeyFromRiscoLayer(linha.layerId, linha.tipoRisco),
        {
          tipoRisco: linha.tipoRisco,
          codigoAlerta: linha.layerId,
          resultado: linha.resultado,
          detalhe: detalheParts.join("; ") || linha.tipoRisco,
          geometrias: [geometria.rotulo],
          origem: "risco",
        },
      );
    }
  }

  if (params.carHistorico && params.carHistorico.resultado !== "Apto") {
    const entry = SOCIOAMBIENTAL_CRITERIA_CATALOG.find(
      (c) => c.id === "car_historico_omissao",
    );
    upsertAlerta(
      map,
      mergeKey(
        entry?.label ?? "Histórico CAR",
        entry?.id ?? "car_historico",
      ),
      {
        tipoRisco: entry?.label ?? "Histórico CAR",
        codigoAlerta: entry?.id ?? "car_historico",
        resultado: params.carHistorico.resultado,
        detalhe: params.carHistorico.detalhe,
        geometrias: [imovel],
        origem: "car",
      },
    );
    for (const alerta of params.carHistorico.alertas) {
      if (alerta.severidade !== "alerta") continue;
      upsertAlerta(
        map,
        mergeKey("Histórico CAR", alerta.tipo),
        {
          tipoRisco: "Histórico CAR",
          codigoAlerta: alerta.tipo,
          resultado: "Alerta",
          detalhe: alerta.mensagem,
          geometrias: [imovel],
          origem: "car",
        },
      );
    }
  }

  for (const hit of params.listasAgente?.hits ?? []) {
    if (hit.resultado === "Apto") continue;
    const entry = SOCIOAMBIENTAL_CRITERIA_CATALOG.find(
      (c) => c.id === hit.criterioId,
    );
    const listaKey = entry
      ? mergeKey(entry.label, entry.id)
      : mergeKey(hit.criterioId.replace(/_/g, " "), hit.criterioId);
    if (map.has(listaKey)) continue;
    upsertAlerta(map, listaKey, {
      tipoRisco: entry?.label ?? hit.criterioId.replace(/_/g, " "),
      codigoAlerta: entry?.id ?? hit.criterioId,
      resultado: hit.resultado,
      detalhe: hit.detalhe,
      geometrias: [imovel],
      origem: "lista",
    });
  }

  return Array.from(map.values()).sort(
    (a, b) => RESULTADO_ORDER[a.resultado] - RESULTADO_ORDER[b.resultado],
  );
}

export async function renderAlertasUnificadosPdfSection(
  session: MmBrandedPdfSession,
  alertas: AlertaExtratoUnificado[],
): Promise<number> {
  let y = brandedPdfNewPage(session);
  y = writeBrandedPdfTitle(session, "Alertas consolidados (sem duplicidade)", 12, y);
  y = writeBrandedPdfParagraph(
    session,
    "Visão única por tipo de risco e código de alerta, agregando imóvel e glebas.",
    9,
    y,
  );

  if (!alertas.length) {
    return writeBrandedPdfParagraph(
      session,
      "Nenhum alerta ou restrição identificado.",
      9,
      y,
    );
  }

  const { default: autoTable } = await import("jspdf-autotable");
  autoTable(session.doc, {
    startY: y,
    margin: { left: session.margins.left, right: session.margins.right },
    head: [["Tipo de risco", "Geometrias", "Resultado", "Detalhe"]],
    body: alertas.map((a) => [
      a.tipoRisco,
      a.geometrias.join(", "),
      a.resultado,
      a.detalhe,
    ]),
    styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
    headStyles: { fillColor: [30, 64, 175], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 48 },
      1: { cellWidth: 32 },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: "auto" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 2) {
        const resultado = String(data.cell.raw ?? "");
        data.cell.styles.fillColor = criterioResultadoFillColor(resultado);
        data.cell.styles.textColor = 255;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  const doc = session.doc as import("jspdf").jsPDF & {
    lastAutoTable?: { finalY: number };
  };
  return (doc.lastAutoTable?.finalY ?? y) + 10;
}

export async function renderCarHistoricoPdfSection(
  session: MmBrandedPdfSession,
  carHistorico: CarHistoricoAvaliacao,
): Promise<number> {
  let y = brandedPdfNewPage(session);
  y = writeBrandedPdfTitle(session, "Histórico CAR (snapshots AmbientaR)", 12, y);
  y = writeBrandedPdfParagraph(
    session,
    `Versões registradas: ${carHistorico.totalSnapshots}. Resultado: ${carHistorico.resultado}.`,
    10,
    y,
  );
  y = writeBrandedPdfParagraph(session, carHistorico.detalhe, 9, y);
  for (const alerta of carHistorico.alertas) {
    y = writeBrandedPdfParagraph(session, `• ${alerta.mensagem}`, 9, y);
  }
  return y + 4;
}
