"use client";

import * as React from "react";
import { GeoJSON, TileLayer, useMap } from "react-leaflet";
import type { FeatureCollection } from "geojson";
import L from "leaflet";
import { LeafletMapShell } from "./leaflet-map-shell";
import type { StudyAreaGeoJSON } from "./study-area-map";

const LAYER_STYLE: Record<string, { color: string; fillColor?: string; weight: number }> = {
  FUND_: { color: "#f8fafc", weight: 3 },
  USO_: { color: "#16a34a", fillColor: "#22c55e", weight: 2 },
  HYD_: { color: "#2563eb", weight: 2 },
  AMB_: { color: "#7c3aed", fillColor: "#a78bfa", weight: 2 },
  INFRA_: { color: "#ea580c", fillColor: "#fb923c", weight: 2 },
  CTX_: { color: "#64748b", weight: 2 },
};

function styleForLayerId(layerId: string): L.PathOptions {
  const prefix = Object.keys(LAYER_STYLE).find((p) => layerId.startsWith(p));
  const base = prefix ? LAYER_STYLE[prefix] : { color: "#94a3b8", weight: 1 };
  return {
    color: base.color,
    fillColor: base.fillColor ?? base.color,
    fillOpacity: base.fillColor ? 0.35 : 0,
    weight: base.weight,
  };
}

function FitBounds({ geo }: { geo: StudyAreaGeoJSON | FeatureCollection | null }) {
  const map = useMap();
  React.useEffect(() => {
    if (!geo) return;
    try {
      const bounds = L.geoJSON(geo as never).getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24] });
    } catch {
      /* ignore */
    }
  }, [geo, map]);
  return null;
}

export type McaProjectMapProps = {
  perimeter: StudyAreaGeoJSON | null;
  layers?: Record<string, FeatureCollection | null>;
};

export function McaProjectMap({ perimeter, layers }: McaProjectMapProps) {
  const overlayEntries = React.useMemo(() => {
    if (!layers) return [];
    return Object.entries(layers).filter(
      ([k, fc]) => k !== "BASE_PERIMETRO" && fc && fc.features?.length,
    );
  }, [layers]);

  const fitGeo = perimeter ?? overlayEntries[0]?.[1] ?? null;

  return (
    <LeafletMapShell
      center={[-18.5122, -44.555]}
      zoom={5}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; Esri'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      {fitGeo ? <FitBounds geo={fitGeo} /> : null}
      {perimeter ? (
        <GeoJSON
          key="perimeter"
          data={perimeter as never}
          style={() => ({ color: "#facc15", weight: 3, fillOpacity: 0.05 })}
        />
      ) : null}
      {overlayEntries.map(([id, fc]) => (
        <GeoJSON
          key={id}
          data={fc as never}
          style={() => styleForLayerId(id)}
        />
      ))}
    </LeafletMapShell>
  );
}
