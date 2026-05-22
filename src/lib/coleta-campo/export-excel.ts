import * as XLSX from '@e965/xlsx';
import type { Inventario, InventarioIndividuo, InventarioParcela } from '@/lib/types';
import { excelHeadersForTipo } from './constants';

export type ExportCampanhaInput = {
  campanha: Inventario;
  parcelas: InventarioParcela[];
  individuos: InventarioIndividuo[];
};

function sortParcelas(a: InventarioParcela, b: InventarioParcela): number {
  const oa = a.ordem ?? 0;
  const ob = b.ordem ?? 0;
  if (oa !== ob) return oa - ob;
  return String(a.codigo ?? '').localeCompare(String(b.codigo ?? ''), 'pt-BR');
}

function sortIndividuos(a: InventarioIndividuo, b: InventarioIndividuo): number {
  const na = a.numero ?? 0;
  const nb = b.numero ?? 0;
  return na - nb;
}

export type ExportValidationIssue = { level: 'error' | 'warn'; message: string };

export function validateCampanhaForExport(input: ExportCampanhaInput): ExportValidationIssue[] {
  const issues: ExportValidationIssue[] = [];
  if (!input.parcelas.length) {
    issues.push({ level: 'error', message: 'Adicione pelo menos uma parcela antes de exportar.' });
  }
  if (!input.individuos.length) {
    issues.push({ level: 'error', message: 'Registre pelo menos um indivíduo (árvore) antes de exportar.' });
  }
  const semCodigo = input.parcelas.filter((p) => !String(p.codigo ?? '').trim());
  if (semCodigo.length) {
    issues.push({ level: 'warn', message: `${semCodigo.length} parcela(s) sem código — revise antes do import.` });
  }
  return issues;
}

export function buildCampanhaExcelRows(input: ExportCampanhaInput): string[][] {
  const tipo = input.campanha.tipoInventario === 'multinivel' ? 'multinivel' : 'simples';
  const headers = excelHeadersForTipo(tipo);
  const parcelaMap = new Map(input.parcelas.map((p) => [p.id, p]));
  const sortedParcelas = [...input.parcelas].sort(sortParcelas);

  const rows: string[][] = [headers];

  for (const parcela of sortedParcelas) {
    const inds = input.individuos
      .filter((i) => i.parcelaId === parcela.id)
      .sort(sortIndividuos);

    if (!inds.length) {
      rows.push(rowForIndividuo(tipo, parcela, null));
      continue;
    }
    for (const ind of inds) {
      rows.push(rowForIndividuo(tipo, parcela, ind));
    }
  }

  return rows;
}

function rowForIndividuo(
  tipo: 'simples' | 'multinivel',
  parcela: InventarioParcela,
  ind: InventarioIndividuo | null,
): string[] {
  const nomeCientifico = ind?.nomeCientifico ?? ind?.especie ?? '';
  const nomeComum = ind?.nomeComum ?? ind?.nomePopular ?? '';
  const base = [
    parcela.codigo ?? '',
    ...(tipo === 'multinivel'
      ? [parcela.up ?? '', parcela.us ?? '', parcela.ni ?? '']
      : []),
    parcela.area != null ? String(parcela.area) : '',
    ind?.numero != null ? String(ind.numero) : '',
    nomeCientifico,
    nomeComum,
    ind?.familia ?? '',
    ind?.cap != null ? String(ind.cap) : '',
    ind?.altura != null ? String(ind.altura) : '',
    ind?.altComercial != null ? String(ind.altComercial) : '',
  ];
  return base;
}

export function downloadCampanhaExcel(input: ExportCampanhaInput, filename?: string): ExportValidationIssue[] {
  const issues = validateCampanhaForExport(input);
  if (issues.some((i) => i.level === 'error')) return issues;

  const rows = buildCampanhaExcelRows(input);
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'IMPORTAR');

  const slug =
    input.campanha.nomeEmpreendimentoManual?.slice(0, 24) ||
    input.campanha.id.slice(0, 8) ||
    'campanha';
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, filename ?? `Coleta_${slug}_${date}.xlsx`);
  return issues;
}
