import type { Fuso } from "@/lib/types";
import type { CoordinateValidationIssue, DmsComponents } from "./types";
import { dmsMagnitudeToDecimal } from "./dms";
import { parseUtmInteger } from "./parse-number";

const UTM_X_REGEX = /^\d{6}$/;
const UTM_Y_REGEX = /^\d{7}$/;

/** Valida componentes GMS de latitude ou longitude (magnitudes MG). */
export function validateDmsComponents(
  dms: DmsComponents,
  axis: "lat" | "lng",
): CoordinateValidationIssue[] {
  const issues: CoordinateValidationIssue[] = [];
  const prefix = axis === "lat" ? "latitude" : "longitude";

  const hasAny = [dms.grau, dms.min, dms.seg].some(
    (v) => v != null && String(v).trim() !== "",
  );
  if (!hasAny) return issues;

  const magnitude = dmsMagnitudeToDecimal(dms);
  if (magnitude == null) {
    issues.push({
      field: `${prefix}.grau`,
      message: "Informe grau válido (e minutos/segundos entre 0 e 59).",
    });
    return issues;
  }

  const maxGrau = axis === "lat" ? 33 : 57;
  if (magnitude > maxGrau) {
    issues.push({
      field: `${prefix}.grau`,
      message:
        axis === "lat"
          ? "Latitude fora da faixa típica de MG (0–33°)."
          : "Longitude fora da faixa típica de MG (0–57° O).",
    });
  }

  return issues;
}

/** Valida X (6 dígitos) e Y (7 dígitos) UTM. */
export function validateUtmDigits(
  x: string | undefined,
  y: string | undefined,
): CoordinateValidationIssue[] {
  const issues: CoordinateValidationIssue[] = [];

  const xTrim = x?.trim() ?? "";
  const yTrim = y?.trim() ?? "";

  if (!xTrim && !yTrim) return issues;

  if (xTrim && !UTM_X_REGEX.test(xTrim)) {
    issues.push({
      field: "utm.x",
      message: "Coordenada X (Easting) deve ter 6 dígitos inteiros.",
    });
  }

  if (yTrim && !UTM_Y_REGEX.test(yTrim)) {
    issues.push({
      field: "utm.y",
      message: "Coordenada Y (Northing) deve ter 7 dígitos inteiros.",
    });
  }

  return issues;
}

/** Faixas típicas MG por fuso (validação suave, não bloqueante em outros fusos). */
export function validateUtmMgRanges(
  x: string | undefined,
  y: string | undefined,
  fuso: Fuso = "23",
): CoordinateValidationIssue[] {
  const issues: CoordinateValidationIssue[] = [];
  const easting = parseUtmInteger(x);
  const northing = parseUtmInteger(y);
  if (easting == null || northing == null) return issues;

  if (fuso === "23") {
    if (easting < 400_000 || easting > 900_000) {
      issues.push({
        field: "utm.x",
        message: "Easting atípico para fuso 23S em MG.",
      });
    }
    if (northing < 7_000_000 || northing > 8_600_000) {
      issues.push({
        field: "utm.y",
        message: "Northing atípico para fuso 23S em MG (hemisfério sul).",
      });
    }
  }

  return issues;
}

/** Valida par GMS completo. */
export function validateGmsPair(
  lat: DmsComponents,
  lng: DmsComponents,
): CoordinateValidationIssue[] {
  return [...validateDmsComponents(lat, "lat"), ...validateDmsComponents(lng, "lng")];
}
