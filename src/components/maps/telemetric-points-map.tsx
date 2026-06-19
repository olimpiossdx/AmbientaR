"use client";

import * as React from "react";
import { Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { LeafletMapShell } from "@/components/maps/leaflet-map-shell";
import type { PontoDeMonitoramento } from "@/lib/types";

const DEFAULT_CENTER: [number, number] = [-19.9167, -43.9345];

function FitPointsBounds({ points }: { points: PontoDeMonitoramento[] }) {
  const map = useMap();
  React.useEffect(() => {
    const valid = points.filter((p) => p.lat != null && p.lng != null);
    if (!valid.length) {
      map.setView(DEFAULT_CENTER, 10);
      return;
    }
    if (valid.length === 1) {
      map.setView([valid[0].lat!, valid[0].lng!], 14);
      return;
    }
    const bounds = L.latLngBounds(
      valid.map((p) => [p.lat!, p.lng!] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
  }, [points, map]);
  return null;
}

export type TelemetricPointsMapProps = {
  center: { lat: number; lng: number };
  pontos: PontoDeMonitoramento[];
  className?: string;
  height?: number | string;
};

export function TelemetricPointsMap({
  center,
  pontos,
  className,
  height = 400,
}: TelemetricPointsMapProps) {
  const validPontos = React.useMemo(
    () => pontos.filter((p) => p.lat != null && p.lng != null),
    [pontos],
  );

  const instanceKey = React.useMemo(
    () => validPontos.map((p) => p.id).join(",") || `${center.lat},${center.lng}`,
    [validPontos, center],
  );

  const boxStyle: React.CSSProperties = {
    height: typeof height === "number" ? `${height}px` : height,
    width: "100%",
  };

  return (
    <div className={className ?? "overflow-hidden rounded-lg"} style={boxStyle}>
      <LeafletMapShell
        instanceKey={instanceKey}
        center={[center.lat, center.lng]}
        zoom={validPontos.length > 0 ? 14 : 10}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        <FitPointsBounds points={validPontos} />
        {validPontos.map((p) => (
          <Marker key={p.id} position={[p.lat!, p.lng!]} title={p.nome}>
            <Popup>
              <div className="p-1 min-w-[180px]">
                <p className="font-semibold">{p.nome}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {p.tipo || "Ponto"}
                </p>
                <p className="text-xs mt-1">
                  Vazão instantânea: — m³/s / — m³/h
                  <span className="block text-muted-foreground">
                    (dados da telemetria em implementação)
                  </span>
                </p>
                <p className="text-xs mt-1">Bomba: — (ligada/desligada)</p>
                <p className="text-xs">
                  Alertas: residual a jusante conforme IGAM/ANA
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </LeafletMapShell>
    </div>
  );
}
