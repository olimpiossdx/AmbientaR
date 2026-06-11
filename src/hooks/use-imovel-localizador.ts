"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from "@/firebase";
import type { PerimeterParseInput } from "@/lib/geospatial/perimeter";
import type { LocalizacaoResolvida } from "@/lib/types/localizacao-imovel";

export type ImovelLocalizadorInputMode = "car" | "coordinates" | "gps";

function needsLocalization(mode: ImovelLocalizadorInputMode): boolean {
  return mode === "car" || mode === "coordinates" || mode === "gps";
}

export type UseImovelLocalizadorOptions = {
  initialCarCod?: string;
  defaultInputMode?: ImovelLocalizadorInputMode;
  /** Modo controlado pelo pai (ex.: select externo em /analise-ambiental). */
  controlledInputMode?: ImovelLocalizadorInputMode;
  extratoUfEsperada?: string;
  disabled?: boolean;
  onResolved?: (resolved: LocalizacaoResolvida) => void;
  onConfirmed?: (resolved: LocalizacaoResolvida) => void;
  onCleared?: () => void;
};

export function useImovelLocalizador({
  initialCarCod,
  defaultInputMode = "car",
  controlledInputMode,
  extratoUfEsperada = "MG",
  disabled = false,
  onResolved,
  onConfirmed,
  onCleared,
}: UseImovelLocalizadorOptions) {
  const { auth } = useFirebase();
  const { toast } = useToast();

  const [inputMode, setInputMode] =
    React.useState<ImovelLocalizadorInputMode>(defaultInputMode);
  const [carNumber, setCarNumber] = React.useState("");
  const [coordinateInput, setCoordinateInput] = React.useState("");
  const [gpsAccuracyM, setGpsAccuracyM] = React.useState<number | undefined>();
  const [localizacao, setLocalizacao] =
    React.useState<LocalizacaoResolvida | null>(null);
  const [localizacaoConfirmada, setLocalizacaoConfirmada] = React.useState(false);
  const [isResolving, setIsResolving] = React.useState(false);
  const [selectedCarCod, setSelectedCarCod] = React.useState("");

  const onClearedRef = React.useRef(onCleared);
  onClearedRef.current = onCleared;
  const onResolvedRef = React.useRef(onResolved);
  onResolvedRef.current = onResolved;
  const onConfirmedRef = React.useRef(onConfirmed);
  onConfirmedRef.current = onConfirmed;

  React.useEffect(() => {
    if (initialCarCod?.trim()) {
      setCarNumber(initialCarCod.trim());
      if (!controlledInputMode) setInputMode("car");
    }
  }, [initialCarCod, controlledInputMode]);

  React.useEffect(() => {
    if (controlledInputMode) setInputMode(controlledInputMode);
  }, [controlledInputMode]);

  React.useEffect(() => {
    setLocalizacao(null);
    setSelectedCarCod("");
    setLocalizacaoConfirmada(false);
    onClearedRef.current?.();
  }, [carNumber, coordinateInput, inputMode]);

  const perimeterInput = React.useMemo((): PerimeterParseInput | null => {
    if (inputMode === "car" && carNumber.trim().length > 3) {
      return { dataType: "car", data: carNumber.trim() };
    }
    if (
      (inputMode === "coordinates" || inputMode === "gps") &&
      coordinateInput.trim().length > 3
    ) {
      return { dataType: "coordinates", data: coordinateInput.trim() };
    }
    return null;
  }, [carNumber, coordinateInput, inputMode]);

  const resolveLocalizacao = async (
    codImovelSelecionado?: string,
  ): Promise<LocalizacaoResolvida | null> => {
    if (!perimeterInput || !auth?.currentUser) return null;
    setIsResolving(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/geospatial/resolve-location", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dataType: perimeterInput.dataType,
          data: perimeterInput.data,
          extratoUfEsperada,
          codImovelSelecionado:
            codImovelSelecionado || selectedCarCod || undefined,
          gpsAccuracyM: inputMode === "gps" ? gpsAccuracyM : undefined,
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        resolved?: LocalizacaoResolvida;
      };
      if (!res.ok || !json.resolved) {
        throw new Error(json.error ?? "Falha ao localizar imóvel.");
      }
      const resolved = json.resolved;
      setLocalizacao(resolved);
      setLocalizacaoConfirmada(false);
      onClearedRef.current?.();
      onResolvedRef.current?.(resolved);
      if (resolved.imovelSelecionadoCod) {
        setSelectedCarCod(resolved.imovelSelecionadoCod);
        if (inputMode === "car") {
          setCarNumber(resolved.imovelSelecionadoCod);
        }
      }
      if (resolved.status === "ok") {
        if (inputMode === "coordinates" || inputMode === "gps") {
          const cod = resolved.imovelSelecionadoCod ?? resolved.imoveis[0]?.codImovel;
          if (cod) setCarNumber(cod);
        }
        toast({
          title: "Imóvel localizado",
          description: `${resolved.areaHa.toFixed(2)} ha · confiança ${resolved.confianca}`,
        });
      } else if (resolved.status === "ambiguo") {
        toast({
          title: "Vários imóveis CAR",
          description: "Selecione o imóvel correto e clique em Localizar novamente.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "CAR não encontrado",
          description:
            resolved.avisos.find((a) => !a.includes("APP e Reserva")) ??
            "Nenhum imóvel neste local.",
        });
      }
      return resolved;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao localizar",
        description:
          error instanceof Error ? error.message : "Serviço indisponível.",
      });
      return null;
    } finally {
      setIsResolving(false);
    }
  };

  const handleUseCurrentCoordinates = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Geolocalização indisponível",
        description: "Este navegador não suporta captura de coordenadas.",
      });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setInputMode("gps");
        setCoordinateInput(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        setGpsAccuracyM(accuracy);
        toast({
          title: "Coordenadas capturadas",
          description: `Precisão ±${Math.round(accuracy)} m. Clique em Localizar imóvel.`,
        });
      },
      () => {
        toast({
          variant: "destructive",
          title: "Falha na captura GPS",
          description: "Verifique permissões de localização do navegador.",
        });
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const handleConfirmar = () => {
    if (localizacao?.status !== "ok") return;
    setLocalizacaoConfirmada(true);
    onConfirmedRef.current?.(localizacao);
  };

  const busy = disabled || isResolving;

  return {
    inputMode,
    setInputMode,
    carNumber,
    setCarNumber,
    coordinateInput,
    setCoordinateInput,
    gpsAccuracyM,
    localizacao,
    localizacaoConfirmada,
    isResolving,
    selectedCarCod,
    setSelectedCarCod,
    setLocalizacaoConfirmada,
    perimeterInput,
    needsLocalization,
    resolveLocalizacao,
    handleUseCurrentCoordinates,
    handleConfirmar,
    busy,
  };
}
