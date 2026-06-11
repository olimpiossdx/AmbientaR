"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImovelLocalizadorConfirmacao } from "@/components/geospatial/imovel-localizador-confirmacao";
import {
  useImovelLocalizador,
  type ImovelLocalizadorInputMode,
} from "@/hooks/use-imovel-localizador";
import type { LocalizacaoResolvida } from "@/lib/types/localizacao-imovel";
import type { ConectaGovDemonstrativo } from "@/lib/geospatial/conecta-gov-sicar";
import { useToast } from "@/hooks/use-toast";
import { Database, Loader2, MapPin, Navigation } from "lucide-react";

export type { ImovelLocalizadorInputMode };

export type ImovelLocalizadorPanelProps = {
  initialCarCod?: string;
  defaultInputMode?: ImovelLocalizadorInputMode;
  controlledInputMode?: ImovelLocalizadorInputMode;
  hideModeSelector?: boolean;
  /** Sem borda/título — embed em página com select próprio. */
  variant?: "default" | "embedded";
  disabled?: boolean;
  extratoMgObrigatorioParaConfirmar?: boolean;
  extratoUfEsperada?: string;
  panelTitle?: string;
  panelDescription?: string;
  showCarHistorico?: boolean;
  showConectaGov?: boolean;
  onResolved?: (resolved: LocalizacaoResolvida) => void;
  onConfirmed?: (
    resolved: LocalizacaoResolvida,
    extras?: { conectaGov?: ConectaGovDemonstrativo | null },
  ) => void;
  onCleared?: () => void;
};

export function ImovelLocalizadorPanel({
  initialCarCod,
  defaultInputMode = "car",
  controlledInputMode,
  hideModeSelector = false,
  variant = "default",
  disabled = false,
  extratoMgObrigatorioParaConfirmar = false,
  extratoUfEsperada = "MG",
  panelTitle = "Localização do imóvel (SICAR)",
  panelDescription =
    "Opcional. Localize por CAR, coordenadas ou GPS e confirme para vincular (mesmo fluxo da Análise Geoespacial).",
  showCarHistorico = false,
  showConectaGov = true,
  onResolved,
  onConfirmed,
  onCleared,
}: ImovelLocalizadorPanelProps) {
  const { toast } = useToast();
  const conectaGovRef = React.useRef<ConectaGovDemonstrativo | null>(null);
  const loc = useImovelLocalizador({
    initialCarCod,
    defaultInputMode,
    controlledInputMode,
    extratoUfEsperada,
    disabled,
    onResolved,
    onConfirmed: (resolved) => {
      onConfirmed?.(resolved, { conectaGov: conectaGovRef.current });
      toast({
        title: "Imóvel confirmado",
        description: "Geometria SICAR vinculada.",
      });
    },
    onCleared,
  });

  return (
    <div
      className={
        variant === "embedded"
          ? "space-y-3"
          : "space-y-3 rounded-lg border bg-muted/10 p-4"
      }
    >
      {variant === "default" ? (
        <div>
          <Label className="text-sm font-medium">{panelTitle}</Label>
          <p className="text-xs text-muted-foreground mt-1">{panelDescription}</p>
        </div>
      ) : null}

      {!hideModeSelector ? (
        <Select
          value={loc.inputMode}
          onValueChange={(v) => loc.setInputMode(v as ImovelLocalizadorInputMode)}
          disabled={loc.busy}
        >
          <SelectTrigger className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="car">Número do CAR</SelectItem>
            <SelectItem value="coordinates">Coordenadas (lat, lng)</SelectItem>
            <SelectItem value="gps">Localização GPS (celular)</SelectItem>
          </SelectContent>
        </Select>
      ) : null}

      {loc.inputMode === "car" ? (
        <Input
          placeholder="Ex: MG-3170404-3DBDB334242844B392639D3237B27E10"
          value={loc.carNumber}
          onChange={(e) => loc.setCarNumber(e.target.value)}
          disabled={loc.busy}
        />
      ) : (
        <div className="space-y-2">
          <Input
            placeholder="Ex: -16.357123, -46.905456"
            value={loc.coordinateInput}
            onChange={(e) => loc.setCoordinateInput(e.target.value)}
            disabled={loc.busy}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={loc.handleUseCurrentCoordinates}
            disabled={loc.busy}
          >
            {loc.inputMode === "gps" ? (
              <Navigation className="h-4 w-4" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            {loc.inputMode === "gps" ? "Capturar coordenada atual" : "Capturar GPS"}
          </Button>
          {loc.gpsAccuracyM != null && loc.inputMode === "gps" ? (
            <p className="text-xs text-muted-foreground">
              Precisão GPS: ±{Math.round(loc.gpsAccuracyM)} m
            </p>
          ) : null}
        </div>
      )}

      {loc.needsLocalization(loc.inputMode) && loc.perimeterInput ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="gap-2"
          disabled={loc.busy}
          onClick={() =>
            void loc.resolveLocalizacao(loc.selectedCarCod || undefined)
          }
        >
          {loc.isResolving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Database className="h-4 w-4" />
          )}
          Localizar imóvel
        </Button>
      ) : null}

      {loc.localizacao && loc.needsLocalization(loc.inputMode) ? (
        <ImovelLocalizadorConfirmacao
          localizacao={loc.localizacao}
          selectedCarCod={loc.selectedCarCod}
          onSelectedCarCodChange={(cod) => {
            loc.setSelectedCarCod(cod);
            loc.setLocalizacaoConfirmada(false);
            onCleared?.();
          }}
          confirmed={loc.localizacaoConfirmada}
          onConfirm={loc.handleConfirmar}
          onRelocalizar={() =>
            void loc.resolveLocalizacao(loc.selectedCarCod || undefined)
          }
          isResolving={loc.isResolving}
          disabled={loc.busy}
          extratoMgObrigatorioParaConfirmar={extratoMgObrigatorioParaConfirmar}
          showCarHistorico={showCarHistorico}
          showConectaGov={showConectaGov}
          onConectaGovLoaded={(demo) => {
            conectaGovRef.current = demo;
          }}
        />
      ) : null}
    </div>
  );
}
