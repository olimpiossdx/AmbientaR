"use client";

import * as React from "react";
import type { GeoJSON } from "geojson";
import { GeoJSON as GeoJSONLayer, TileLayer, useMap } from "react-leaflet";
import { LeafletMapShell } from "@/components/maps/leaflet-map-shell";
import type { FadFiscalFinding } from "@/lib/fiscal-ambiental/types";

const SEVERITY_HEX: Record<string, string> = {
  low: "#10b981",
  medium: "#eab308",
  high: "#f97316",
  critical: "#7c3aed",
};

function FitLayers({
  aoi,
  findings,
}: {
  aoi?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  findings: FadFiscalFinding[];
}) {
  const map = useMap();
  React.useEffect(() => {
    import("leaflet").then((L) => {
      try {
        const geoms = [
          ...(aoi ? [aoi] : []),
          ...findings.filter((f) => f.geometry).map((f) => f.geometry!),
        ];
        if (!geoms.length) return;
        const group = L.geoJSON(geoms as never);
        const bounds = group.getBounds();
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24] });
      } catch {
        /* ignore */
      }
    });
  }, [aoi, findings, map]);
  return null;
}

type FadFindingsMapProps = {
  aoi?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  findings: FadFiscalFinding[];
  selectedId?: string | null;
};

export function FadFindingsMap({ aoi, findings, selectedId }: FadFindingsMapProps) {
  const withGeom = findings.filter((f) => f.geometry && f.status !== "dismissed");

  const collection: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: withGeom.map((f) => ({
      type: "Feature",
      properties: {
        id: f.id,
        title: f.title,
        severity: f.severity,
        areaHa: f.areaHa,
      },
      geometry: f.geometry!,
    })),
  };

  return (
    <LeafletMapShell center={[-18.5, -44.5]} zoom={6} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      {aoi ? (
        <GeoJSONLayer
          data={aoi as never}
          style={() => ({
            color: "#facc15",
            weight: 2,
            fillColor: "#facc15",
            fillOpacity: 0.05,
          })}
        />
      ) : null}
      <GeoJSONLayer
        key={`${selectedId ?? ""}-${withGeom.length}`}
        data={collection as never}
        style={(feature) => {
          const sev = feature?.properties?.severity as string;
          const id = feature?.properties?.id as string;
          const color = SEVERITY_HEX[sev] ?? "#f97316";
          return {
            color,
            weight: id === selectedId ? 3 : 2,
            fillColor: color,
            fillOpacity: id === selectedId ? 0.55 : 0.4,
          };
        }}
        onEachFeature={(feature, layer) => {
          const title = feature?.properties?.title;
          const area = feature?.properties?.areaHa;
          layer.bindPopup(`${title}${area != null ? ` · ~${area} ha` : ""}`);
        }}
      />
      <FitLayers aoi={aoi} findings={withGeom} />
    </LeafletMapShell>
  );
}
