"use client";

import * as React from "react";
import type { CoordinateFormat } from "@/lib/types";
import { deriveDecimalFromLocationFields } from "@/lib/coordinates";

type DecimalPreviewProps = {
  format: CoordinateFormat | undefined;
  latLong: unknown;
  utm: unknown;
};

export function CoordinateDecimalPreview({
  format,
  latLong,
  utm,
}: DecimalPreviewProps) {
  const decimal = React.useMemo(() => {
    if (!format) return undefined;
    return deriveDecimalFromLocationFields(format, {
      latLong: latLong as Parameters<typeof deriveDecimalFromLocationFields>[1]["latLong"],
      utm: utm as Parameters<typeof deriveDecimalFromLocationFields>[1]["utm"],
    });
  }, [format, latLong, utm]);

  if (!decimal) {
    return (
      <p className="text-xs text-muted-foreground">
        Preencha as coordenadas para ver a conversão decimal (Sul/Oeste).
      </p>
    );
  }

  return (
    <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs space-y-1">
      <p className="font-medium text-foreground">Preview decimal (SIRGAS 2000)</p>
      <p className="font-mono tabular-nums">
        Lat {decimal.lat.toFixed(6)} · Long {decimal.lng.toFixed(6)}
      </p>
      <p className="text-muted-foreground">
        Hemisfério Sul e oeste de Greenwich — sinais negativos aplicados automaticamente.
      </p>
    </div>
  );
}
