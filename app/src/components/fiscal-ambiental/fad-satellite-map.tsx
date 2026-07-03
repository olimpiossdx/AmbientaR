"use client";

import * as React from "react";
import type { GeoJSON } from "geojson";
import { GeoJSON as GeoJSONLayer, ImageOverlay, TileLayer, useMap } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import { LeafletMapShell } from "@/components/maps/leaflet-map-shell";

function FitAoi({ aoi }: { aoi: GeoJSON.Polygon | GeoJSON.MultiPolygon }) {
  const map = useMap();
  React.useEffect(() => {
    import("leaflet").then((L) => {
      try {
        const bounds = L.geoJSON(aoi as never).getBounds();
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24] });
      } catch {
        /* ignore */
      }
    });
  }, [aoi, map]);
  return null;
}

type FadSatelliteMapProps = {
  aoi: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  previewUrl?: string;
  bounds?: [number, number, number, number];
};

export function FadSatelliteMap({ aoi, previewUrl, bounds }: FadSatelliteMapProps) {
  const overlayBounds: LatLngBoundsExpression | undefined = bounds
    ? [
        [bounds[1], bounds[0]],
        [bounds[3], bounds[2]],
      ]
    : undefined;

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
          fillOpacity: 0.08,
        })}
      />
      <FitAoi aoi={aoi} />
      {previewUrl && overlayBounds ? (
        <ImageOverlay url={previewUrl} bounds={overlayBounds} opacity={0.92} />
      ) : null}
    </LeafletMapShell>
  );
}
