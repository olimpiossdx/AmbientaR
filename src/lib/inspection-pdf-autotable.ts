/**
 * Cores de criticidade / status NC em tabelas jspdf-autotable (laudo de vistoria).
 */

import type { CellHookData } from 'jspdf-autotable';
import { CHECKLIST_STATUS_LABELS } from '@/lib/field-inspection-checklist';
import {
  applyInconformidadePdfCellStyle,
  inconformidadePdfCriticalityStyle,
  inconformidadePdfStatusNcStyle,
  normalizeInconformidadeCriticality,
} from '@/lib/status-display-classes';

const NC_STATUS_LABEL = CHECKLIST_STATUS_LABELS.nao_conforme;

function criticalityFromChecklistRow(data: CellHookData): string {
  const rowIdx = data.row.index;
  const rawCrit = data.table.body[rowIdx]?.cells?.[2]?.raw;
  return String(rawCrit ?? '—');
}

/** Tabela checklist: Status NC (claro) + Criticidade (médio), mesmo tom. */
export function checklistCriticalityDidParseCell(data: CellHookData): void {
  if (data.section !== 'body') return;

  const criticalityRaw = criticalityFromChecklistRow(data);

  if (data.column.index === 1) {
    const status = String(data.cell.raw ?? '');
    if (status === NC_STATUS_LABEL) {
      applyInconformidadePdfCellStyle(
        data.cell.styles,
        inconformidadePdfStatusNcStyle(criticalityRaw),
      );
    }
    return;
  }

  if (data.column.index === 2) {
    const crit = String(data.cell.raw ?? '').trim();
    if (crit && crit !== '—') {
      applyInconformidadePdfCellStyle(
        data.cell.styles,
        inconformidadePdfCriticalityStyle(crit),
      );
    }
  }
}

/** Tabela legada de inconformidades: só coluna Criticidade. */
export function legacyInconformidadeCriticalityDidParseCell(data: CellHookData): void {
  if (data.section !== 'body' || data.column.index !== 1) return;
  const crit = String(data.cell.raw ?? '').trim();
  if (!crit) return;
  applyInconformidadePdfCellStyle(
    data.cell.styles,
    inconformidadePdfCriticalityStyle(crit),
  );
}
