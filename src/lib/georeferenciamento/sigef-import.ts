import * as XLSX from "@e965/xlsx";
import type { GeorefVertice, GeorefVerticesMeta } from "@/lib/georeferenciamento/types";
import { verticesToPolygonGeoJSON } from "@/lib/georeferenciamento/vertices-to-geojson";

export type GeorefImportResult = GeorefVerticesMeta & {
  polygonGeojson?: object;
};

function parseNum(raw: unknown): number | undefined {
  if (raw == null || raw === "") return undefined;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const s = String(raw).trim().replace(/\s/g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function normHeader(h: string): string {
  return h
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function detectColumns(headers: string[]): {
  codigo?: number;
  lat?: number;
  lon?: number;
  east?: number;
  north?: number;
  alt?: number;
  confrontante?: number;
} {
  const idx: ReturnType<typeof detectColumns> = {};
  headers.forEach((h, i) => {
    const n = normHeader(h);
    if (!n) return;
    if (/vertice|vert\b|codigo|cod\b|ponto/.test(n) && idx.codigo == null) idx.codigo = i;
    if (/latitude|\blat\b/.test(n) && idx.lat == null) idx.lat = i;
    if (/longitude|\blon\b|\blng\b|\blong\b/.test(n) && idx.lon == null) idx.lon = i;
    if (/^este$|\be\b|coord.*e|utm.*e|x\b/.test(n) && idx.east == null) idx.east = i;
    if (/^norte$|\bn\b|coord.*n|utm.*n|y\b/.test(n) && idx.north == null) idx.north = i;
    if (/altitude|\balt\b|\bh\b|elipso/.test(n) && idx.alt == null) idx.alt = i;
    if (/confrontante|limite|vizinho/.test(n) && idx.confrontante == null) idx.confrontante = i;
  });
  return idx;
}

function rowsToVertices(
  rows: unknown[][],
  headerRowIndex: number,
): { vertices: GeorefVertice[]; warnings: string[] } {
  const warnings: string[] = [];
  const headers = (rows[headerRowIndex] ?? []).map((c) => String(c ?? ""));
  const cols = detectColumns(headers);
  if (cols.lat == null && cols.lon == null && cols.east == null && cols.north == null) {
    return { vertices: [], warnings: ["Não foi possível identificar colunas de coordenadas."] };
  }
  const vertices: GeorefVertice[] = [];
  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => c == null || String(c).trim() === "")) continue;
    const v: GeorefVertice = {
      sequencia: vertices.length + 1,
      codigo: cols.codigo != null ? String(row[cols.codigo] ?? "").trim() || undefined : undefined,
      lat: cols.lat != null ? parseNum(row[cols.lat]) : undefined,
      lon: cols.lon != null ? parseNum(row[cols.lon]) : undefined,
      easting: cols.east != null ? parseNum(row[cols.east]) : undefined,
      northing: cols.north != null ? parseNum(row[cols.north]) : undefined,
      altitude: cols.alt != null ? parseNum(row[cols.alt]) : undefined,
      confrontante:
        cols.confrontante != null
          ? String(row[cols.confrontante] ?? "").trim() || undefined
          : undefined,
    };
    const hasGeo = (v.lat != null && v.lon != null) || (v.easting != null && v.northing != null);
    if (hasGeo) vertices.push(v);
  }
  if (vertices.length > 0 && vertices.every((v) => v.easting != null && v.lat == null)) {
    warnings.push(
      "Coordenadas parecem ser UTM (Este/Norte). O mapa exibirá o polígono apenas se houver latitude/longitude; use exportação geográfica do SIGEF ou transforme para SIRGAS2000.",
    );
  }
  return { vertices, warnings };
}

function findHeaderRow(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const line = (rows[i] ?? []).map((c) => normHeader(String(c ?? ""))).join(" ");
    if (/latitude|longitude|vertice|este|norte|coordenada/.test(line)) return i;
  }
  return 0;
}

function parseCsvText(text: string): unknown[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  return lines.map((line) => {
    const sep = line.includes(";") ? ";" : ",";
    return line.split(sep).map((c) => c.replace(/^"|"$/g, "").trim());
  });
}

function parseGeoJson(text: string): GeorefImportResult {
  const warnings: string[] = [];
  const geo = JSON.parse(text) as {
    type?: string;
    geometry?: { type?: string; coordinates?: unknown };
    features?: { geometry?: { type?: string; coordinates?: unknown } }[];
  };
  let coords: number[][] | null = null;
  const g =
    geo.type === "FeatureCollection"
      ? geo.features?.[0]?.geometry
      : geo.type === "Feature"
        ? geo.geometry
        : geo;
  const geom = (g as { type?: string; coordinates?: unknown }) ?? geo;
  if (geom?.type === "Polygon" && Array.isArray(geom.coordinates)) {
    coords = (geom.coordinates as number[][][])[0] as number[][];
  } else if (geom?.type === "LineString" && Array.isArray(geom.coordinates)) {
    coords = geom.coordinates as number[][];
  }
  if (!coords?.length) {
    return {
      vertices: [],
      warnings: ["GeoJSON sem polígono ou linha válida."],
      format: "geojson",
      importedAt: new Date().toISOString(),
    };
  }
  const vertices: GeorefVertice[] = coords.map((c, i) => ({
    sequencia: i + 1,
    lon: c[0],
    lat: c[1],
    altitude: c[2],
  }));
  const polygonGeojson = verticesToPolygonGeoJSON(vertices) ?? undefined;
  return {
    vertices,
    polygonGeojson,
    format: "geojson",
    crsHint: "EPSG:4674 (SIRGAS2000 geográfico)",
    importedAt: new Date().toISOString(),
    warnings,
  };
}

function parseKmlOrXml(text: string): GeorefImportResult {
  const warnings: string[] = [];
  const coordBlocks = [...text.matchAll(/<coordinates[^>]*>([\s\S]*?)<\/coordinates>/gi)];
  const all: number[][] = [];
  for (const m of coordBlocks) {
    const pairs = m[1]
      .trim()
      .split(/\s+/)
      .map((p) => p.split(",").map((x) => parseNum(x)))
      .filter((a) => a.length >= 2 && a[0] != null && a[1] != null) as number[][];
    all.push(...pairs);
  }
  if (!all.length) {
    return {
      vertices: [],
      warnings: ["Nenhuma coordenada encontrada no KML/XML."],
      format: "kml",
      importedAt: new Date().toISOString(),
    };
  }
  const vertices: GeorefVertice[] = all.map((c, i) => ({
    sequencia: i + 1,
    lon: c[0],
    lat: c[1],
    altitude: c[2],
  }));
  return {
    vertices,
    polygonGeojson: verticesToPolygonGeoJSON(vertices) ?? undefined,
    format: "kml",
    crsHint: "KML (WGS84/SIRGAS)",
    importedAt: new Date().toISOString(),
    warnings,
  };
}

function parseSheetRows(
  rows: unknown[][],
  format: "xlsx" | "ods" | "csv",
): GeorefImportResult {
  const headerRow = findHeaderRow(rows);
  const { vertices, warnings } = rowsToVertices(rows, headerRow);
  return {
    vertices,
    polygonGeojson: verticesToPolygonGeoJSON(vertices) ?? undefined,
    format,
    crsHint: vertices.some((v) => v.lat != null) ? "SIRGAS2000 geográfico" : "Possível UTM",
    importedAt: new Date().toISOString(),
    warnings,
  };
}

/** Importa planilha SIGEF (ODS/XLSX), CSV, GeoJSON ou KML/XML de coordenadas. */
export async function importGeorefFile(file: File): Promise<GeorefImportResult> {
  const name = file.name.toLowerCase();
  const ext = name.split(".").pop() ?? "";

  if (ext === "geojson" || ext === "json") {
    const text = await file.text();
    const result = parseGeoJson(text);
    result.sourceFile = file.name;
    return result;
  }

  if (ext === "kml" || ext === "xml") {
    const text = await file.text();
    const result = parseKmlOrXml(text);
    result.sourceFile = file.name;
    return result;
  }

  if (ext === "csv" || ext === "txt") {
    const text = await file.text();
    const rows = parseCsvText(text);
    const result = parseSheetRows(rows, "csv");
    result.sourceFile = file.name;
    return result;
  }

  if (ext === "xlsx" || ext === "xls" || ext === "ods") {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    let best: GeorefImportResult = {
      vertices: [],
      warnings: ["Nenhuma aba com vértices encontrada."],
      format: ext === "ods" ? "ods" : "xlsx",
    };
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      if (!sheet) continue;
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: "",
      }) as unknown[][];
      const candidate = parseSheetRows(rows, ext === "ods" ? "ods" : "xlsx");
      if (candidate.vertices.length > best.vertices.length) {
        best = {
          ...candidate,
          warnings: [
            ...(candidate.warnings ?? []),
            `Aba utilizada: ${sheetName}`,
          ],
        };
      }
    }
    best.sourceFile = file.name;
    return best;
  }

  throw new Error(
    "Formato não suportado. Use ODS/XLSX (planilha SIGEF), CSV, GeoJSON ou KML/XML.",
  );
}
