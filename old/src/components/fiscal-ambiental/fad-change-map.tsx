"use client";

import * as React from "react";
import type { GeoJSON } from "geojson";
import { GeoJSON as GeoJSONLayer, TileLayer, useMap } from "react-leaflet";
import { LeafletMapShell } from "@/components/maps/leaflet-map-shell";
import {
  CHANGE_TYPE_COLORS,
  CHANGE_TYPE_LABELS,
} from "@/lib/fiscal-ambiental/intelligence-labels";
import type { FadChangePolygon } from "@/lib/fiscal-ambiental/types";

function FitLayers({
  aoi,
  polygons,
}: {
  aoi: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  polygons: FadChangePolygon[];
}) {
  const map = useMap();
  React.useEffect(() => {
    import("leaflet").then((L) => {
      try {
        const features = [aoi, ...polygons.map((p) => p.geometry)];
        const group = L.geoJSON(features as never);
        const bounds = group.getBounds();
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24] });
      } catch {
        /* ignore */
      }
    });
  }, [aoi, polygons, map]);
  return null;
}

type FadChangeMapProps = {
  aoi: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  polygons: FadChangePolygon[];
};

export function FadChangeMap({ aoi, polygons }: FadChangeMapProps) {
  const collection: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: polygons.map((p) => ({
      type: "Feature",
      properties: { type: p.type, areaHa: p.areaHa },
      geometry: p.geometry,
    })),
  };

  return (
    <LeafletMapShell center={[-18.5, -44.5]} zoom={6} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      <GeoJSONLayer
        data={aoi as never}
        style={() => ({
          color: "#facc15",
          weight: 2,
          fillColor: "#facc15",
          fillOpacity: 0.05,
        })}
      />
      <GeoJSONLayer
        key={JSON.stringify(polygons).slice(0, 80)}
        data={collection as never}
        style={(feature) => {
          const type = feature?.properties?.type as keyof typeof CHANGE_TYPE_COLORS;
          const color = CHANGE_TYPE_COLORS[type] ?? "#f97316";
          return {
            color,
            weight: 2,
            fillColor: color,
            fillOpacity: 0.45,
          };
        }}
        onEachFeature={(feature, layer) => {
          const type = feature?.properties?.type as keyof typeof CHANGE_TYPE_LABELS;
          const area = feature?.properties?.areaHa;
          const label = CHANGE_TYPE_LABELS[type] ?? "Alteração";
          layer.bindPopup(`${label}${area != null ? ` · ~${area} ha` : ""}`);
        }}
      />
      <FitLayers aoi={aoi} polygons={polygons} />
    </LeafletMapShell>
  );
}
