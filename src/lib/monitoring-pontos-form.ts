import { z } from "zod";
import type { PontoDeMonitoramento, PontoMonitoramentoTipo } from "@/lib/types";
import {
  createDefaultCoordinateBlock,
  deriveDecimalFromLocationFields,
} from "@/lib/coordinates";
import { decimalToDmsMagnitudes } from "@/lib/coordinates/dms";
import type { CoordinateFormat } from "@/lib/types";

export type MonitoringPontoCoordenadasForm = ReturnType<
  typeof createDefaultCoordinateBlock
> & {
  format: CoordinateFormat;
};

export const pontoMonitoramentoFormSchema = z.object({
  id: z.string(),
  nome: z.string().min(1, "Nome do ponto é obrigatório."),
  tipo: z.enum(["bomba", "jusante"]).optional(),
  /** Entrada uniforme GMS/UTM (SIRGAS 2000). Persistência continua em `lat`/`lng`. */
  coordenadas: z.any().optional(),
  /** Legado — usos insignificantes até F23; fallback no submit se `coordenadas` vazio. */
  latStr: z.string().optional(),
  lngStr: z.string().optional(),
  rtdbDeviceId: z.string().optional(),
  pulsesPerLiterStr: z.string().optional(),
  internalDiameterMStr: z.string().optional(),
  miraPointCode: z.string().optional(),
});

export type PontoMonitoramentoFormValues = z.infer<
  typeof pontoMonitoramentoFormSchema
>;

export function newMonitoringPontoId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `ponto-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createDefaultMonitoringPontoCoordenadas(): MonitoringPontoCoordenadasForm {
  return createDefaultCoordinateBlock("format", "UTM") as MonitoringPontoCoordenadasForm;
}

/** Reconstrói bloco de formulário a partir de `lat`/`lng` gravados no Firestore. */
export function latLngToMonitoringCoordenadas(
  lat?: number,
  lng?: number,
): MonitoringPontoCoordenadasForm {
  const block = createDefaultMonitoringPontoCoordenadas();
  if (
    lat != null &&
    lng != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  ) {
    block.format = "Lat/Long";
    block.latLong = {
      lat: decimalToDmsMagnitudes(lat),
      long: decimalToDmsMagnitudes(lng),
    };
  }
  return block;
}

/** Deriva `lat`/`lng` decimais a partir do bloco de coordenadas do formulário. */
export function monitoringCoordenadasToLatLng(
  coordenadas?: MonitoringPontoCoordenadasForm | null,
): { lat?: number; lng?: number } {
  if (!coordenadas?.format) return {};
  const decimal = deriveDecimalFromLocationFields(coordenadas.format, {
    latLong: coordenadas.latLong,
    utm: coordenadas.utm,
  });
  if (!decimal) return {};
  return { lat: decimal.lat, lng: decimal.lng };
}

export function parseOptionalNumber(s?: string | null): number | undefined {
  if (s == null || String(s).trim() === "") return undefined;
  const n = Number(String(s).replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

export function mapFirestorePontoToForm(
  p: PontoDeMonitoramento,
): PontoMonitoramentoFormValues {
  return {
    id: p.id,
    nome: p.nome,
    tipo: p.tipo,
    coordenadas: latLngToMonitoringCoordenadas(p.lat, p.lng),
    latStr: p.lat != null ? String(p.lat) : "",
    lngStr: p.lng != null ? String(p.lng) : "",
    rtdbDeviceId: p.rtdbDeviceId ?? "",
    pulsesPerLiterStr:
      p.pulsesPerLiter != null ? String(p.pulsesPerLiter) : "",
    internalDiameterMStr:
      p.internalDiameterM != null ? String(p.internalDiameterM) : "",
    miraPointCode: p.miraPointCode ?? "",
  };
}

export function mapPontosFromFirestore(
  pontos: PontoDeMonitoramento[] | undefined,
): PontoMonitoramentoFormValues[] {
  if (!pontos?.length) return [];
  return pontos.map(mapFirestorePontoToForm);
}

export function formPontosToFirestore(
  rows: PontoMonitoramentoFormValues[],
): PontoDeMonitoramento[] {
  return rows.map((p) => {
    const fromCoords = monitoringCoordenadasToLatLng(
      p.coordenadas as MonitoringPontoCoordenadasForm | undefined,
    );
    const lat = fromCoords.lat ?? parseOptionalNumber(p.latStr);
    const lng = fromCoords.lng ?? parseOptionalNumber(p.lngStr);
    const pulsesPerLiter = parseOptionalNumber(p.pulsesPerLiterStr);
    const internalDiameterM = parseOptionalNumber(p.internalDiameterMStr);
    const base: PontoDeMonitoramento = {
      id: p.id,
      nome: p.nome.trim(),
      tipo: p.tipo as PontoMonitoramentoTipo | undefined,
    };
    if (lat !== undefined) base.lat = lat;
    if (lng !== undefined) base.lng = lng;
    const rtdb = p.rtdbDeviceId?.trim();
    if (rtdb) base.rtdbDeviceId = rtdb;
    if (pulsesPerLiter !== undefined) base.pulsesPerLiter = pulsesPerLiter;
    if (internalDiameterM !== undefined)
      base.internalDiameterM = internalDiameterM;
    const mpc = p.miraPointCode?.trim();
    if (mpc) base.miraPointCode = mpc;
    return base;
  });
}

export function emptyMonitoringPontoFormRow(): PontoMonitoramentoFormValues {
  return {
    id: newMonitoringPontoId(),
    nome: "",
    coordenadas: createDefaultMonitoringPontoCoordenadas(),
    latStr: "",
    lngStr: "",
    rtdbDeviceId: "",
    pulsesPerLiterStr: "",
    internalDiameterMStr: "",
    miraPointCode: "",
  };
}
