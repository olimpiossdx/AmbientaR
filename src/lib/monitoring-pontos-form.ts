import { z } from "zod";
import type { PontoDeMonitoramento, PontoMonitoramentoTipo } from "@/lib/types";

export const pontoMonitoramentoFormSchema = z.object({
  id: z.string(),
  nome: z.string().min(1, "Nome do ponto é obrigatório."),
  tipo: z.enum(["bomba", "jusante"]).optional(),
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
    const lat = parseOptionalNumber(p.latStr);
    const lng = parseOptionalNumber(p.lngStr);
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
    latStr: "",
    lngStr: "",
    rtdbDeviceId: "",
    pulsesPerLiterStr: "",
    internalDiameterMStr: "",
    miraPointCode: "",
  };
}
