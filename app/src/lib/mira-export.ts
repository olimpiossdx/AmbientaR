/**
 * Exportação **MIRA-ready** (placeholder de esquema até o manual oficial IGAM/MIRA
 * definir colunas e periodicidade definitivas).
 */

import type {
  TelemetryReading,
  WaterPermit,
  InsignificantWaterUse,
} from "@/lib/types";

/** Incrementar quando colunas ou regras de export mudarem (transparência / auditoria). */
export const MIRA_EXPORT_SCHEMA_VERSION = "placeholder-0.3";

export type MiraExportAlvo =
  | { tipo: "outorga"; registro: WaterPermit }
  | { tipo: "uso_insignificante"; registro: InsignificantWaterUse };

export type MiraExportContext = {
  alvo: MiraExportAlvo;
  /** ISO 8601 — geralmente new Date().toISOString() */
  generatedAtIso: string;
};

function pontosMapFromAlvo(alvo: MiraExportAlvo) {
  return new Map(
    (alvo.registro.pontosDeMonitoramento ?? []).map((p) => [p.id, p]),
  );
}

function condicionanteM3s(alvo: MiraExportAlvo): number | undefined {
  return alvo.registro.condicionanteFlowLimitM3s;
}

function miraStation(alvo: MiraExportAlvo): string | undefined {
  return alvo.registro.miraStationId;
}

function escopoIds(alvo: MiraExportAlvo) {
  if (alvo.tipo === "outorga") {
    return {
      registroTipo: "outorga",
      outorgaId: alvo.registro.id,
      usoInsignificanteId: "",
    };
  }
  return {
    registroTipo: "uso_insignificante",
    outorgaId: "",
    usoInsignificanteId: alvo.registro.id,
  };
}

function escapeCsvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Hash curto para comparar duplicidade de arquivo (não é criptográfico). */
export function fingerprintExportContent(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 65599);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

const CSV_COLUMNS = [
  "mira_schema_version",
  "export_generated_at",
  "registro_tipo",
  "portaria",
  "outorga_id",
  "uso_insignificante_id",
  "mira_station_id",
  "reading_id",
  "ponto_id",
  "ponto_nome",
  "mira_point_code",
  "rtdb_device_id",
  "timestamp_utc",
  "pump_on",
  "flow_m3s",
  "flow_m3h",
  "flow_l_min",
  "pulses_per_s",
  "velocity_ms",
  "nivel_m",
  "ph",
  "downstream_residual_m3s",
  "downstream_min_level_m",
  "alert_red",
  "alert_orange",
  "data_quality",
  "condicionante_flow_limit_m3s",
] as const;

function velocityMs(
  flowM3s: number | undefined,
  internalDiameterM: number | undefined,
): string {
  if (flowM3s == null || internalDiameterM == null || internalDiameterM <= 0)
    return "";
  const a = Math.PI * Math.pow(internalDiameterM / 2, 2);
  if (a <= 0) return "";
  const v = flowM3s / a;
  return Number.isFinite(v) ? v.toFixed(6) : "";
}

/**
 * Gera CSV UTF-8 com BOM inicial (facilita Excel em PT-BR).
 * Ordem de colunas estável para futura aderência ao layout MIRA.
 */
export function buildMiraReadyCsv(
  readings: TelemetryReading[],
  ctx: MiraExportContext,
): string {
  const { alvo, generatedAtIso } = ctx;
  const pontoById = pontosMapFromAlvo(alvo);
  const scope = escopoIds(alvo);
  const lim = condicionanteM3s(alvo);
  const station = miraStation(alvo);

  const lines: string[] = [];
  lines.push(CSV_COLUMNS.join(","));

  for (const r of readings) {
    const ponto = pontoById.get(r.pontoId);
    const row: Record<(typeof CSV_COLUMNS)[number], string> = {
      mira_schema_version: MIRA_EXPORT_SCHEMA_VERSION,
      export_generated_at: generatedAtIso,
      registro_tipo: scope.registroTipo,
      portaria: alvo.registro.permitNumber ?? "",
      outorga_id: scope.outorgaId,
      uso_insignificante_id: scope.usoInsignificanteId,
      mira_station_id: station ?? "",
      reading_id: r.id,
      ponto_id: r.pontoId,
      ponto_nome: ponto?.nome ?? "",
      mira_point_code: ponto?.miraPointCode ?? "",
      rtdb_device_id: ponto?.rtdbDeviceId ?? "",
      timestamp_utc: r.timestamp,
      pump_on: r.pumpOn ? "1" : "0",
      flow_m3s: r.flowRateM3s != null ? String(r.flowRateM3s) : "",
      flow_m3h: r.flowRateM3h != null ? String(r.flowRateM3h) : "",
      flow_l_min: r.flowRateLmin != null ? String(r.flowRateLmin) : "",
      pulses_per_s: r.pulsesPerSecond != null ? String(r.pulsesPerSecond) : "",
      velocity_ms: velocityMs(r.flowRateM3s, ponto?.internalDiameterM),
      nivel_m: r.nivelM != null ? String(r.nivelM) : "",
      ph: r.ph != null ? String(r.ph) : "",
      downstream_residual_m3s:
        r.downstreamResidualM3s != null ? String(r.downstreamResidualM3s) : "",
      downstream_min_level_m:
        r.downstreamMinLevelM != null ? String(r.downstreamMinLevelM) : "",
      alert_red: r.alertRed ? "1" : "0",
      alert_orange: r.alertOrange ? "1" : "0",
      data_quality: r.dataQuality ?? "",
      condicionante_flow_limit_m3s:
        lim != null ? String(lim) : "",
    };
    lines.push(CSV_COLUMNS.map((k) => escapeCsvCell(row[k])).join(","));
  }

  const body = lines.join("\r\n");
  return `\uFEFF${body}`;
}

export function buildMiraReadyJson(
  readings: TelemetryReading[],
  ctx: MiraExportContext,
): string {
  const { alvo, generatedAtIso } = ctx;
  const base = escopoIds(alvo);
  return JSON.stringify(
    {
      miraSchemaVersion: MIRA_EXPORT_SCHEMA_VERSION,
      generatedAt: generatedAtIso,
      registroTipo: base.registroTipo,
      portaria: alvo.registro.permitNumber,
      outorgaId: base.outorgaId || undefined,
      usoInsignificanteId: base.usoInsignificanteId || undefined,
      rowCount: readings.length,
      readings,
    },
    null,
    2,
  );
}

export function downloadTextFile(
  filename: string,
  content: string,
  mime: string,
) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function suggestedMiraExportBasename(alvo: MiraExportAlvo): string {
  const safe = (alvo.registro.permitNumber || alvo.registro.id).replace(
    /[^\w\-]+/g,
    "_",
  );
  const scope =
    alvo.tipo === "outorga" ? "outorga" : "uso_ins";
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `mira-ready_${scope}_${safe}_${y}${m}${day}_${MIRA_EXPORT_SCHEMA_VERSION}`;
}
