import type {
  CoordinateDecimal,
  CoordinateFormat,
  GeographicLocationFields,
} from "@/lib/types";
import { DEFAULT_UTM_FUSO } from "./constants";
import { gmsPairMgToDecimal } from "./dms";
import { utmFormToDecimal } from "./utm";

/**
 * Deriva `{ lat, lng }` decimal a partir dos campos de formulário existentes.
 * Não altera paths Firestore — apenas calcula o derivado opcional.
 */
export function deriveDecimalFromLocationFields(
  format: CoordinateFormat,
  fields: Pick<GeographicLocationFields, "latLong" | "utm">,
): CoordinateDecimal | undefined {
  if (format === "Lat/Long") {
    const lat = fields.latLong?.lat;
    const lng = fields.latLong?.long;
    if (!lat || !lng) return undefined;
    return gmsPairMgToDecimal(lat, lng);
  }

  if (format === "UTM") {
    const utm = fields.utm;
    if (!utm) return undefined;
    return utmFormToDecimal(
      utm.x,
      utm.y,
      utm.fuso ?? DEFAULT_UTM_FUSO,
    );
  }

  return undefined;
}

type CoordinateBlockWithFormat = Pick<
  GeographicLocationFields,
  "latLong" | "utm" | "decimal"
> & {
  format?: CoordinateFormat;
  formato?: CoordinateFormat;
};

/** Acrescenta `decimal` derivado num bloco GMS/UTM (campo `format` ou `formato`). */
export function enrichCoordinateBlockWithDecimal<
  T extends CoordinateBlockWithFormat,
>(block: T, formatField: "format" | "formato"): T {
  const fmt = block[formatField];
  if (!fmt) return block;

  const decimal = deriveDecimalFromLocationFields(fmt, {
    latLong: block.latLong,
    utm: block.utm,
  });

  if (!decimal) {
    if (block.decimal == null) return block;
    const { decimal: _removed, ...rest } = block;
    return rest as T;
  }

  return { ...block, decimal };
}

/** Acrescenta `decimal` derivado antes de persistir (mantém demais campos intactos). */
export function enrichGeographicLocationWithDecimal<
  T extends {
    geographicLocation?: CoordinateBlockWithFormat & { format?: CoordinateFormat };
  },
>(values: T): T {
  const geo = values.geographicLocation;
  if (!geo?.format) return values;

  return {
    ...values,
    geographicLocation: enrichCoordinateBlockWithDecimal(geo, "format"),
  };
}

/** Enriquece trechos E (`listagemE.geoTrecho.inicio/fim`) com `decimal` derivado. */
export function enrichListagemEGeoTrechoWithDecimal<
  T extends {
    listagemE?: {
      geoTrecho?: {
        inicio?: CoordinateBlockWithFormat;
        fim?: CoordinateBlockWithFormat;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
  },
>(values: T): T {
  const geoTrecho = values.listagemE?.geoTrecho;
  if (!geoTrecho) return values;

  const nextGeoTrecho = { ...geoTrecho };
  if (geoTrecho.inicio) {
    nextGeoTrecho.inicio = enrichCoordinateBlockWithDecimal(
      geoTrecho.inicio,
      "formato",
    );
  }
  if (geoTrecho.fim) {
    nextGeoTrecho.fim = enrichCoordinateBlockWithDecimal(
      geoTrecho.fim,
      "formato",
    );
  }

  return {
    ...values,
    listagemE: {
      ...values.listagemE,
      geoTrecho: nextGeoTrecho,
    },
  };
}

/** Enriquece `geographicLocation` e trechos E (`listagemE.geoTrecho.inicio/fim`). */
export function enrichProjectFormCoordinates<
  T extends {
    geographicLocation?: CoordinateBlockWithFormat & { format?: CoordinateFormat };
    listagemE?: {
      geoTrecho?: {
        inicio?: CoordinateBlockWithFormat;
        fim?: CoordinateBlockWithFormat;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
  },
>(values: T): T {
  return enrichListagemEGeoTrechoWithDecimal(
    enrichGeographicLocationWithDecimal(values),
  );
}
