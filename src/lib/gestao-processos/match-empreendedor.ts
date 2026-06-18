import type { Empreendedor } from "@/lib/types";
import { normalizeProcessText } from "@/lib/gestao-processos/utils";

function normalizeName(value: string): string {
  return normalizeProcessText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Tenta vincular empreendedor pelo nome (importação da planilha). */
export function resolveEmpreendedorIdByName(
  name: string,
  empreendedores: Empreendedor[] | undefined,
): string | undefined {
  const target = normalizeName(name);
  if (!target || target === "—") return undefined;

  const exact = (empreendedores ?? []).find(
    (e) => normalizeName(e.name) === target,
  );
  if (exact) return exact.id;

  const contains = (empreendedores ?? []).find((e) => {
    const n = normalizeName(e.name);
    return n.includes(target) || target.includes(n);
  });
  return contains?.id;
}

export function officeProcessVisibleToPortal(
  process: { empreendedorId?: string; empreendedorName: string },
  allowedEmpreendedorIds: string[],
  empreendedorNameById: Map<string, string>,
): boolean {
  if (process.empreendedorId) {
    return allowedEmpreendedorIds.includes(process.empreendedorId);
  }

  const target = normalizeName(process.empreendedorName);
  if (!target || target === "—") return false;

  for (const id of allowedEmpreendedorIds) {
    const name = empreendedorNameById.get(id);
    if (!name) continue;
    const n = normalizeName(name);
    if (n === target || n.includes(target) || target.includes(n)) {
      return true;
    }
  }
  return false;
}
