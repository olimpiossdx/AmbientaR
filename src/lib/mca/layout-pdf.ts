/**
 * PDF cartográfico — módulo Mapas / MCA (Estudos Técnicos).
 * Rota: /studies/mapas · Código: src/lib/mca/*
 *
 * Independente de Análise Geoespacial (IA): src/lib/geospatial/*, /analise-ambiental.
 */

import type { jsPDF } from "jspdf";
import type { Feature, FeatureCollection } from "geojson";
import type { McaProjectDoc } from "./types";
import { formatAreaBr } from "./tables";
import {
  drawMcaCartouche,
  drawMcaConsultancyFooter,
  drawMcaLegend,
  drawMcaMapPanel,
  drawMcaMapRasterFrame,
  type McaPdfMapRect,
} from "./map-preview-pdf";
import type { McaConsultancyBranding } from "./company-branding-server";
import type { BrandingPdfImages } from "@/lib/branding-pdf";

export type McaLayoutPdfOptions = {
  layers?: Record<string, FeatureCollection>;
  /** PNG/JPEG data URL do mapa Leaflet (opcional, substitui desenho vetorial). */
  mapImageDataUrl?: string | null;
  branding?: McaConsultancyBranding;
  brandingImages?: BrandingPdfImages | null;
};

function toFeatureCollection(
  geo: McaProjectDoc["perimeterGeoJson"],
): FeatureCollection | null {
  if (!geo || typeof geo !== "object") return null;
  const g = geo as { type?: string };
  if (g.type === "FeatureCollection") return geo as FeatureCollection;
  if (g.type === "Feature") {
    return { type: "FeatureCollection", features: [geo as Feature] };
  }
  if (g.type === "Polygon" || g.type === "MultiPolygon") {
    return {
      type: "FeatureCollection",
      features: [{ type: "Feature", properties: {}, geometry: geo as Feature["geometry"] }],
    };
  }
  return null;
}

function addMapImage(doc: jsPDF, dataUrl: string, rect: McaPdfMapRect): boolean {
  try {
    const props = doc.getImageProperties(dataUrl);
    const ratio = props.width / props.height;
    let w = rect.w;
    let h = w / ratio;
    if (h > rect.h) {
      h = rect.h;
      w = h * ratio;
    }
    const x = rect.x + (rect.w - w) / 2;
    const y = rect.y + (rect.h - h) / 2;
    const fmt = dataUrl.includes("image/jpeg") ? "JPEG" : "PNG";
    doc.addImage(dataUrl, fmt, x, y, w, h);
    return true;
  } catch {
    return false;
  }
}

export async function buildMcaLayoutPdf(
  project: McaProjectDoc & { id?: string },
  options?: McaLayoutPdfOptions,
): Promise<Buffer> {
  const { jsPDF: JsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new JsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const m = project.meta;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const mapRect: McaPdfMapRect = {
    x: pageW - 148,
    y: 14,
    w: 134,
    h: 118,
  };

  const branding = options?.branding ?? {
    companyName: "Pimenta Consultoria Ambiental",
    address: "Unaí — MG",
    email: "pimentambiental@hotmail.com",
  };

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.35);
  const titleW = 118;
  const titleX = (pageW - titleW) / 2;
  doc.rect(titleX, 10, titleW, 10, "S");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("USO E OCUPAÇÃO DO SOLO", pageW / 2, 16.5, { align: "center" });
  doc.setFontSize(8);
  doc.text("Sistema de Coordenadas Planas — UTM · SIRGAS 2000 (EPSG:31983)", 14, 24);

  const layers = options?.layers ?? {};
  const perimeter = toFeatureCollection(project.perimeterGeoJson);

  let mapDrawn = false;
  if (options?.mapImageDataUrl) {
    mapDrawn = addMapImage(doc, options.mapImageDataUrl, mapRect);
    if (mapDrawn) {
      drawMcaMapRasterFrame(doc, mapRect, perimeter, layers);
    }
  }
  if (!mapDrawn) {
    mapDrawn = drawMcaMapPanel(doc, mapRect, perimeter, layers);
    if (!mapDrawn) {
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("Sem geometria para mapa — defina perímetro ou execute pipeline E06–E09.", mapRect.x + 4, mapRect.y + 20);
    }
  }

  drawMcaCartouche(doc, mapRect, {
    propertyName: m.propertyName ?? project.title,
    ownerName: m.ownerName,
    scale: m.scale,
    technicalResponsible: m.technicalResponsible,
    crea: m.crea,
    municipality: m.municipality,
  });

  const legendKeys = Object.keys(layers).filter((k) => layers[k]?.features?.length);
  if (perimeter?.features?.length && !legendKeys.includes("BASE_PERIMETRO")) {
    legendKeys.unshift("BASE_PERIMETRO");
  }
  drawMcaLegend(doc, mapRect.x + 4, mapRect.y + mapRect.h - 52, legendKeys);

  drawMcaConsultancyFooter(doc, mapRect.x, pageH - 22, mapRect.w, branding);

  const footerImg = options?.brandingImages?.footerBase64;
  if (footerImg) {
    try {
      doc.addImage(footerImg, "PNG", 14, pageH - 18, pageW - mapRect.w - 28, 12);
    } catch {
      /* opcional */
    }
  }

  const info = [
    ["Propriedade", m.propertyName ?? project.title],
    ["Proprietário", m.ownerName ?? "—"],
    ["Município", m.municipality ?? "—"],
    ["Matrículas", (m.matriculas ?? []).join(", ") || "—"],
    ["CAR", m.car ?? "—"],
    ["Área total", m.areaTotalHa != null ? `${formatAreaBr(m.areaTotalHa)} ha` : "—"],
    ["Escala", m.scale ?? "1:12.000"],
    ["Resp. técn.", m.technicalResponsible ?? "—"],
    ["CREA", m.crea ?? "—"],
  ];

  autoTable(doc, {
    startY: 32,
    margin: { left: 14, right: pageW - mapRect.x + 8 },
    tableWidth: mapRect.x - 22,
    head: [["Campo", "Valor"]],
    body: info,
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [30, 41, 59] },
  });

  let y =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 90;

  const tableMargin = { left: 14, right: pageW - mapRect.x + 8 };
  const tableWidth = mapRect.x - 22;

  if (project.tables?.uso?.length) {
    autoTable(doc, {
      startY: y + 4,
      margin: tableMargin,
      tableWidth,
      head: [["Uso e ocupação", "Área (ha)", "%"]],
      body: project.tables.uso.map((r) => [
        r.classe,
        formatAreaBr(r.areaHa),
        r.percent != null ? r.percent.toFixed(2) : "—",
      ]),
      styles: { fontSize: 8, cellPadding: 1.5 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y;
  }

  if (project.tables?.app?.length) {
    autoTable(doc, {
      startY: y + 4,
      margin: tableMargin,
      tableWidth,
      head: [["APP", "Área (ha)", "%"]],
      body: project.tables.app.map((r) => [
        r.classe,
        formatAreaBr(r.areaHa),
        r.percent != null ? r.percent.toFixed(2) : "—",
      ]),
      styles: { fontSize: 8, cellPadding: 1.5 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y;
  }

  if (project.tables?.rl?.length) {
    if (y > pageH - 40) {
      doc.addPage();
      y = 20;
    }
    autoTable(doc, {
      startY: y + 4,
      margin: tableMargin,
      tableWidth,
      head: [["Matrícula", "Gleba", "Área (ha)", "Compensada"]],
      body: project.tables.rl.map((r) => [
        r.matricula,
        r.gleba,
        formatAreaBr(r.areaHa),
        r.compensada ? "Sim" : "Não",
      ]),
      styles: { fontSize: 7, cellPadding: 1.5 },
    });
  }

  const scores = project.scores;
  if (scores?.final != null) {
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(
      `Nota MCA: ${scores.final.toFixed(1)} (geom ${scores.geometric?.toFixed(0) ?? "—"} · topo ${scores.topological?.toFixed(0) ?? "—"} · amb ${scores.environmental?.toFixed(0) ?? "—"} · vis ${scores.visual?.toFixed(0) ?? "—"})`,
      14,
      pageH - 10,
    );
  }

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `${branding.companyName} · MCA E13 · ${project.id ?? ""} · ${new Date().toLocaleDateString("pt-BR")}`,
    14,
    pageH - 5,
  );

  const arr = doc.output("arraybuffer");
  return Buffer.from(arr);
}
