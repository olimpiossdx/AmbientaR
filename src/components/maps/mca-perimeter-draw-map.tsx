"use client";

import * as React from "react";
import { GeoJSON, TileLayer, FeatureGroup, useMap } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import "leaflet-draw/dist/leaflet.draw.css";
import { LeafletMapShell } from "./leaflet-map-shell";
import type { StudyAreaGeoJSON } from "./study-area-map";

const MapUpdater = ({ polygon }: { polygon: StudyAreaGeoJSON }) => {
  const map = useMap();
  React.useEffect(() => {
    if (polygon) {
      try {
        const bounds = L.geoJSON(polygon as never).getBounds();
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24] });
      } catch {
        /* ignore */
      }
    }
  }, [polygon, map]);
  return null;
};

export type McaPerimeterDrawMapProps = {
  polygon: StudyAreaGeoJSON | null;
  onPolygonChange: (geo: StudyAreaGeoJSON | null) => void;
};

/**
 * Mapa de desenho do perímetro — submenu Mapas / MCA (Estudos Técnicos).
 * Padrão visual igual ao de captura da Análise Geoespacial (satélite + polígono),
 * mas código autónomo (não importa analise-ambiental nem lib/geospatial).
 */
export function McaPerimeterDrawMap({ polygon, onPolygonChange }: McaPerimeterDrawMapProps) {
  const handleCreated = (e: { layer: L.Layer }) => {
    const layer = e.layer as L.Layer & { toGeoJSON: () => StudyAreaGeoJSON };
    onPolygonChange(layer.toGeoJSON());
  };

  const handleEdited = (e: { layers: L.LayerGroup }) => {
    e.layers.eachLayer((layer) => {
      const lyr = layer as L.Layer & { toGeoJSON: () => StudyAreaGeoJSON };
      onPolygonChange(lyr.toGeoJSON());
    });
  };

  const handleDeleted = () => {
    onPolygonChange(null);
  };

  return (
    <LeafletMapShell
      center={[-18.5122, -44.555]}
      zoom={5}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.esri.com/en-us/home">Esri</a>'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      <FeatureGroup>
        <EditControl
          position="topleft"
          onCreated={handleCreated as (e: unknown) => void}
          onEdited={handleEdited as (e: unknown) => void}
          onDeleted={handleDeleted}
          draw={{
            rectangle: false,
            circle: false,
            circlemarker: false,
            marker: false,
            polyline: false,
          }}
        />
        {polygon ? (
          <>
            <GeoJSON
              key={JSON.stringify(polygon).slice(0, 120)}
              data={polygon as never}
              style={() => ({
                color: "#15803d",
                weight: 3,
                fillColor: "#22c55e",
                fillOpacity: 0.25,
              })}
            />
            <MapUpdater polygon={polygon} />
          </>
        ) : null}
      </FeatureGroup>
    </LeafletMapShell>
  );
}
