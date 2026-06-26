import * as XLSX from '@e965/xlsx';

export type ParsedExcelSheet = {
  sheetNames: string[];
  workbook: XLSX.WorkBook;
  headers: string[];
  rows: Record<string, unknown>[];
};

/** Carrega planilha consolidada (URL do Storage) para o assistente de importação. */
export async function fetchAndParseConsolidatedExcel(
  downloadUrl: string,
): Promise<ParsedExcelSheet> {
  const res = await fetch(downloadUrl);
  if (!res.ok) {
    throw new Error(`Não foi possível baixar a planilha (${res.status}).`);
  }
  const data = new Uint8Array(await res.arrayBuffer());
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetNames = workbook.SheetNames;
  const preferred =
    sheetNames.find((n) => n.toUpperCase() === 'IMPORTAR') ?? sheetNames[0];
  if (!preferred) {
    throw new Error('Planilha consolidada sem abas.');
  }

  const sheet = workbook.Sheets[preferred];
  const jsonData: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (!jsonData.length) {
    return { sheetNames, workbook, headers: [], rows: [] };
  }

  const headers = ((jsonData[0] as string[]) ?? []).filter((h) => h);
  const rows = jsonData.slice(1).map((row) => {
    const rowData: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      rowData[header] = (row as unknown[])[index];
    });
    return rowData;
  });

  return { sheetNames, workbook, headers, rows };
}
