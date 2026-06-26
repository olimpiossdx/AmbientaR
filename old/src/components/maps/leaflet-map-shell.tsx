"use client";

import * as React from "react";
import { MapContainer, type MapContainerProps } from "react-leaflet";
import { setupLeafletDefaultIcons } from "@/lib/leaflet/setup-default-icons";
import "leaflet/dist/leaflet.css";

export type LeafletMapShellProps = MapContainerProps & {
  /** Força novo mapa quando o contexto muda (ex.: troca de aba com outro mapa). */
  instanceKey?: string;
};

/**
 * Wrapper do MapContainer — evita erros de reutilização do container Leaflet
 * com React 18 Strict Mode e remounts no Next.js dev.
 */
export function LeafletMapShell({
  instanceKey,
  children,
  className,
  style,
  ...mapProps
}: LeafletMapShellProps) {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    setupLeafletDefaultIcons();
    setReady(true);
    // Strict Mode: desmonta o mapa antes do remount para o cleanup do
    // MapContainer correr com o DOM ainda exclusivo desta instância.
    return () => setReady(false);
  }, []);

  const boxStyle: React.CSSProperties = {
    height: "100%",
    width: "100%",
    ...style,
  };

  if (!ready) {
    return <div className={className} style={boxStyle} aria-hidden />;
  }

  const containerKey = instanceKey ?? "default";

  return (
    <div key={containerKey} className={className} style={boxStyle}>
      <MapContainer style={boxStyle} {...mapProps}>
        {children}
      </MapContainer>
    </div>
  );
}
