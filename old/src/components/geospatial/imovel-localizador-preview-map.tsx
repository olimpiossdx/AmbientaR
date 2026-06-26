"use client";

import * as React from "react";
import { GeoJSON, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { Feature, Polygon } from "geojson";
import { LeafletMapShell } from "@/components/maps/leaflet-map-shell";

const PERIMETER_STYLE: L.PathOptions = {
  color: "#ca8a04",
  weight: 3,
  fillColor: "#facc15",
  fillOpacity: 0.28,
};

function FitBounds({ feature }: { feature: Feature<Polygon> }) {
  const map = useMap();
  React.useEffect(() => {
    try {
      const bounds = L.geoJSON(feature as never).getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20], maxZoom: 16 });
      }
    } catch {
      /* ignore invalid geometry */
    }
  }, [feature, map]);
  return null;
}

type ImovelLocalizadorPreviewMapProps = {
  perimetro: Feature<Polygon>;
  className?: string;
  /** Altura CSS do container (default 220px mobile-friendly). */
  height?: number | string;
};

export function ImovelLocalizadorPreviewMap({
  perimetro,
  className,
  height = 220,
}: ImovelLocalizadorPreviewMapProps) {
  const boxStyle: React.CSSProperties = {
    height: typeof height === "number" ? `${height}px` : height,
    width: "100%",
  };

  return (
    <div
      className={className ?? "overflow-hidden rounded-lg border"}
      style={boxStyle}
    >
      <LeafletMapShell
        instanceKey={JSON.stringify(perimetro.geometry.coordinates[0]?.[0])}
        center={[-18.5, -44.5]}
        zoom={5}
        scrollWheelZoom={false}
        dragging
        touchZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        <GeoJSON
          key={JSON.stringify(perimetro.geometry).slice(0, 80)}
          data={perimetro as never}
          style={() => PERIMETER_STYLE}
        />
        <FitBounds feature={perimetro} />
      </LeafletMapShell>
    </div>
  );
}
