import type { Empreendedor } from "@/lib/types";

const DEFAULT_INTERVAL_HOURS = 24;
const MIN_INTERVAL_HOURS = 6;

export function getMtrAutoSyncIntervalMs(emp: Empreendedor): number {
  const hours = emp.mtrIntegracao?.autoSyncIntervalHours ?? DEFAULT_INTERVAL_HOURS;
  const clamped = Math.max(MIN_INTERVAL_HOURS, Math.min(168, hours));
  return clamped * 60 * 60 * 1000;
}

export function isMtrAutoSyncEnabled(emp: Empreendedor): boolean {
  return emp.mtrIntegracao?.autoSyncEnabled === true;
}

/** True se passou o intervalo desde `lastSyncAt` (ou nunca sincronizou). */
export function shouldRunMtrAutoSync(emp: Empreendedor, now = Date.now()): boolean {
  if (!isMtrAutoSyncEnabled(emp)) return false;
  const last = emp.mtrIntegracao?.lastSyncAt;
  if (!last) return true;
  const lastMs = new Date(last).getTime();
  if (Number.isNaN(lastMs)) return true;
  return now - lastMs >= getMtrAutoSyncIntervalMs(emp);
}

export function empreendedoresParaAutoSync(
  empreendedores: Empreendedor[],
): Empreendedor[] {
  return empreendedores.filter((e) => shouldRunMtrAutoSync(e));
}
