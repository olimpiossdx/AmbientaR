import * as XLSX from "@e965/xlsx";
import type {
  OfficeProcess,
  OfficeProcessExcelRow,
  OfficeProcessImportPreview,
} from "@/lib/gestao-processos/types";
import {
  buildOfficeProcessExternalKey,
  detectTipoProcesso,
  inferFaseFromStatus,
  normalizeProcessText,
  parseExcelOrTextDate,
} from "@/lib/gestao-processos/utils";

const HEADER_ALIASES: Record<string, keyof OfficeProcessExcelRow | "ignore"> = {
  processo: "numeroProcesso",
  "nº processo": "numeroProcesso",
  "numero processo": "numeroProcesso",
  "tipo processo": "tipoProcesso" as keyof OfficeProcessExcelRow,
  empreendedor: "empreendedorName",
  empreendimento: "empreendimentoName",
  municipio: "municipio",
  "tipo de intervenção": "tipoIntervencao",
  "tipo de intervencao": "tipoIntervencao",
  status: "statusDetalhe",
  prazo: "prazo",
  fase: "fase",
};

function normalizeHeader(value: unknown): string {
  return normalizeProcessText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function mapHeaderRow(row: unknown[]): Partial<Record<keyof OfficeProcessExcelRow, number>> {
  const map: Partial<Record<keyof OfficeProcessExcelRow, number>> = {};
  row.forEach((cell, index) => {
    const key = HEADER_ALIASES[normalizeHeader(cell)];
    if (key && key !== "ignore") {
      map[key] = index;
    }
  });
  return map;
}

function cellValue(row: unknown[], index: number | undefined): string {
  if (index == null) return "";
  return normalizeProcessText(row[index]);
}

export function parseOfficeProcessWorkbook(
  workbook: XLSX.WorkBook,
  sheetName?: string,
): OfficeProcessImportPreview {
  const preferred =
    sheetName ??
    workbook.SheetNames.find((n) => normalizeHeader(n) === "processo") ??
    workbook.SheetNames[0];

  if (!preferred) {
    return { rows: [], errors: [{ rowNumber: 0, message: "Planilha sem abas." }], duplicatesInFile: [] };
  }

  const sheet = workbook.Sheets[preferred];
  const matrix: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
  });

  if (!matrix.length) {
    return { rows: [], errors: [], duplicatesInFile: [] };
  }

  const headerMap = mapHeaderRow(matrix[0] ?? []);
  if (headerMap.numeroProcesso == null) {
    return {
      rows: [],
      errors: [
        {
          rowNumber: 1,
          message: 'Coluna "PROCESSO" não encontrada na primeira linha.',
        },
      ],
      duplicatesInFile: [],
    };
  }

  const rows: OfficeProcessExcelRow[] = [];
  const errors: OfficeProcessImportPreview["errors"] = [];
  const seen = new Map<string, number>();
  const duplicatesInFile: string[] = [];

  for (let i = 1; i < matrix.length; i++) {
    const row = matrix[i] ?? [];
    const numeroProcesso = cellValue(row, headerMap.numeroProcesso);
    const empreendedorName = cellValue(row, headerMap.empreendedorName);
    const empreendimentoName = cellValue(row, headerMap.empreendimentoName);

    if (!numeroProcesso && !empreendedorName && !empreendimentoName) continue;

    const rowNumber = i + 1;
    if (!numeroProcesso) {
      errors.push({ rowNumber, message: "Número do processo (SEI/SLA) obrigatório." });
      continue;
    }

    const tipoRaw = cellValue(row, headerMap.tipoProcesso as number | undefined);
    const tipoProcesso =
      tipoRaw.toLowerCase() === "sla"
        ? "sla"
        : tipoRaw.toLowerCase() === "sei"
          ? "sei"
          : detectTipoProcesso(numeroProcesso);

    const statusDetalhe = cellValue(row, headerMap.statusDetalhe) || undefined;
    const prazoRaw = headerMap.prazo != null ? row[headerMap.prazo] : undefined;
    const prazo = parseExcelOrTextDate(prazoRaw);

    const faseRaw = cellValue(row, headerMap.fase);
    const fase =
      faseRaw === "elaboracao" ||
      faseRaw === "protocolado" ||
      faseRaw === "em_analise" ||
      faseRaw === "exigencia" ||
      faseRaw === "concluido" ||
      faseRaw === "arquivado"
        ? faseRaw
        : inferFaseFromStatus(statusDetalhe, tipoProcesso);

    const externalKey = buildOfficeProcessExternalKey(tipoProcesso, numeroProcesso);
    if (seen.has(externalKey)) {
      duplicatesInFile.push(numeroProcesso);
    } else {
      seen.set(externalKey, rowNumber);
    }

    rows.push({
      numeroProcesso,
      tipoProcesso,
      empreendedorName: empreendedorName || "—",
      empreendimentoName: empreendimentoName || "—",
      municipio: cellValue(row, headerMap.municipio) || undefined,
      tipoIntervencao: cellValue(row, headerMap.tipoIntervencao) || undefined,
      statusDetalhe,
      prazo,
      fase,
      rowNumber,
    });
  }

  return { rows, errors, duplicatesInFile };
}

export async function parseOfficeProcessFile(
  file: File,
): Promise<OfficeProcessImportPreview> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
  return parseOfficeProcessWorkbook(workbook);
}

export function buildOfficeProcessExportWorkbook(
  processes: OfficeProcess[],
): ArrayBuffer {
  const rows = [
    [
      "TIPO_PROCESSO",
      "NUMERO_PROCESSO",
      "EMPREENDEDOR",
      "EMPREENDIMENTO",
      "MUNICIPIO",
      "TIPO DE INTERVENÇÃO",
      "FASE",
      "STATUS",
      "PRAZO",
      "OBSERVACOES",
    ],
    ...processes.map((p) => [
      p.tipoProcesso.toUpperCase(),
      p.numeroProcesso,
      p.empreendedorName,
      p.empreendimentoName,
      p.municipio ?? "",
      p.tipoIntervencao ?? "",
      p.fase,
      p.statusDetalhe ?? "",
      p.prazo ?? "",
      p.observacoes ?? "",
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "PROCESSO");
  return XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
}

export function downloadOfficeProcessExport(
  processes: OfficeProcess[],
  filename = "gestao-processos.xlsx",
): void {
  const buffer = buildOfficeProcessExportWorkbook(processes);
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
