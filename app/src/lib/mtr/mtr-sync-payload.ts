import type { MtrCdfListItem } from "@/lib/mtr/mtr-api-client";
import type { MtrDeclaracaoSource, MtrDeclaracaoTipo } from "@/lib/types";

export type MtrDeclaracaoInsert = {
  empreendedorId: string;
  titulo: string;
  tipo: MtrDeclaracaoTipo;
  source: MtrDeclaracaoSource;
  externalCodigo: string;
  listaMtr?: number[];
  periodoInicio?: string;
  periodoFim?: string;
  syncedAt: string;
  ownerId: string;
};

export function buildMtrDeclaracaoInserts(opts: {
  empreendedorId: string;
  ownerId: string;
  cdfList: MtrCdfListItem[];
  manifestoCodigos: string[];
  existingKeys: Set<string>;
  inicio: Date;
  fim: Date;
  syncedAt: string;
}): { inserts: MtrDeclaracaoInsert[]; skipped: number } {
  const inserts: MtrDeclaracaoInsert[] = [];
  let skipped = 0;

  for (const cdf of opts.cdfList) {
    const code = cdf.cdfCodigo != null ? String(cdf.cdfCodigo) : "";
    if (!code) continue;
    const key = `cdf:${code}`;
    if (opts.existingKeys.has(key)) {
      skipped += 1;
      continue;
    }
    inserts.push({
      empreendedorId: opts.empreendedorId,
      titulo: `CDF nº ${code}`,
      tipo: "cdf",
      source: "api_cdf",
      externalCodigo: code,
      listaMtr: cdf.listaMtr ?? [],
      periodoInicio: cdf.cdfDataInicial
        ? new Date(cdf.cdfDataInicial).toISOString()
        : opts.inicio.toISOString(),
      periodoFim: cdf.cdfDataFinal
        ? new Date(cdf.cdfDataFinal).toISOString()
        : opts.fim.toISOString(),
      syncedAt: opts.syncedAt,
      ownerId: opts.ownerId,
    });
    opts.existingKeys.add(key);
  }

  for (const barcode of opts.manifestoCodigos) {
    if (!barcode?.trim()) continue;
    const key = `manifesto:${barcode}`;
    if (opts.existingKeys.has(key)) {
      skipped += 1;
      continue;
    }
    inserts.push({
      empreendedorId: opts.empreendedorId,
      titulo: `Manifesto ${barcode.slice(0, 10)}…`,
      tipo: "manifesto",
      source: "api_manifesto",
      externalCodigo: barcode,
      syncedAt: opts.syncedAt,
      ownerId: opts.ownerId,
    });
    opts.existingKeys.add(key);
  }

  return { inserts, skipped };
}
