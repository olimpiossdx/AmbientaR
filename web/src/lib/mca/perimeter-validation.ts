import type { Feature, FeatureCollection, Polygon, Position } from "geojson";
import { isValidPerimeter, perimeterAreaHa, toFeatureCollection } from "./perimeter";

export type PerimeterValidationCheck = {
  id: string;
  pass: boolean;
  label: string;
  detail: string;
  severity: "error" | "warning";
};

export type PerimeterValidationResult = {
  ok: boolean;
  areaHa: number;
  checks: PerimeterValidationCheck[];
};

const MIN_AREA_HA = 0.01;
const MAX_AREA_HA = 500_000;

function outerRing(
  geo: FeatureCollection | Feature | Polygon | undefined,
): Position[] | null {
  const fc = toFeatureCollection(geo);
  const f = fc?.features?.[0];
  if (!f?.geometry) return null;
  if (f.geometry.type === "Polygon") return f.geometry.coordinates[0] ?? null;
  if (f.geometry.type === "MultiPolygon") return f.geometry.coordinates[0]?.[0] ?? null;
  return null;
}

function ringIsClosed(ring: Position[]): boolean {
  if (ring.length < 4) return false;
  const a = ring[0]!;
  const b = ring[ring.length - 1]!;
  const eps = 1e-8;
  return (
    Math.abs(a[0]! - b[0]!) <= eps &&
    Math.abs(a[1]! - b[1]!) <= eps
  );
}

function geojsonStableKey(geo: unknown): string {
  try {
    return JSON.stringify(geo);
  } catch {
    return "";
  }
}

/** Validação E05 — perímetro + metadados mínimos antes do pipeline MCA. */
export function validateMcaPerimeter(
  geo: FeatureCollection | Feature | Polygon | undefined,
  options?: {
    areaTotalHa?: number;
    car?: string;
    crs?: string;
    projectPerimeterGeoJson?: unknown;
    editorGeoJson?: unknown;
  },
): PerimeterValidationResult {
  const checks: PerimeterValidationCheck[] = [];
  const fc = toFeatureCollection(geo);
  const areaHa = fc ? perimeterAreaHa(fc) : 0;
  const valid = isValidPerimeter(geo);

  checks.push({
    id: "geometry",
    pass: Boolean(fc?.features?.length),
    label: "Geometria presente",
    detail: fc?.features?.length ? `${fc.features.length} feição(ões)` : "Desenhe ou importe o limite",
    severity: "error",
  });

  checks.push({
    id: "area_valid",
    pass: valid,
    label: "Área mensurável",
    detail: valid ? `${areaHa.toFixed(4)} ha` : "Polígono inválido ou área ≤ 0,01 ha",
    severity: "error",
  });

  if (areaHa > 0) {
    checks.push({
      id: "area_range",
      pass: areaHa >= MIN_AREA_HA && areaHa <= MAX_AREA_HA,
      label: "Faixa de área",
      detail:
        areaHa < MIN_AREA_HA
          ? "Área demasiado pequena"
          : areaHa > MAX_AREA_HA
            ? "Área acima do limite operacional"
            : `${areaHa.toFixed(2)} ha`,
      severity: "error",
    });
  }

  const ring = outerRing(geo);
  const ringOk = ring
    ? ringIsClosed(ring) || (ring.length >= 3 && valid)
    : false;
  checks.push({
    id: "ring_closed",
    pass: ringOk,
    label: "Anel fechado",
    detail: ring
      ? ringOk
        ? `${ring.length} vértices`
        : "Anel exterior inválido (mín. 3 vértices)"
      : "Sem anel exterior",
    severity: "error",
  });

  const crs = options?.crs ?? "EPSG:31983";
  checks.push({
    id: "crs",
    pass: crs.startsWith("EPSG:"),
    label: "CRS definido",
    detail: crs,
    severity: "error",
  });

  const car = options?.car?.trim();
  checks.push({
    id: "car_meta",
    pass: Boolean(car && car.length >= 4),
    label: "CAR (metadado)",
    detail: car ? car.slice(0, 48) : "Opcional — recomendado para relatórios fundiários",
    severity: "warning",
  });

  if (options?.areaTotalHa != null && options.areaTotalHa > 0 && areaHa > 0) {
    const diffPct = Math.abs(options.areaTotalHa - areaHa) / areaHa;
    checks.push({
      id: "area_declared",
      pass: diffPct <= 0.15,
      label: "Área declarada vs. calculada",
      detail: `Declarada ${options.areaTotalHa.toFixed(2)} ha · calculada ${areaHa.toFixed(2)} ha`,
      severity: "warning",
    });
  }

  if (options?.projectPerimeterGeoJson != null && options?.editorGeoJson != null) {
    const same =
      geojsonStableKey(options.projectPerimeterGeoJson) ===
      geojsonStableKey(options.editorGeoJson);
    checks.push({
      id: "saved_on_project",
      pass: same,
      label: "Perímetro guardado no projecto",
      detail: same
        ? "Editor alinhado com Firestore"
        : "Guarde o perímetro antes de executar o pipeline",
      severity: "warning",
    });
  } else if (options?.projectPerimeterGeoJson == null && fc?.features?.length) {
    checks.push({
      id: "saved_on_project",
      pass: false,
      label: "Perímetro guardado no projecto",
      detail: "Use «Guardar perímetro» após criar o projecto",
      severity: "warning",
    });
  }

  const errors = checks.filter((c) => c.severity === "error" && !c.pass);
  return {
    ok: errors.length === 0,
    areaHa,
    checks,
  };
}
