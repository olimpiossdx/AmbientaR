"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Feature, Polygon } from "geojson";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildCarDemonstrativoUrl,
  buildCarPortalPublicoUrl,
} from "@/lib/geospatial/car-portal-url";
import type { ImovelSicarResumo, LocalizacaoResolvida } from "@/lib/types/localizacao-imovel";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { ConectaGovDemonstrativoBlock } from "@/components/geospatial/conecta-gov-demonstrativo-block";
import { CarHistoricoPanel } from "@/components/geospatial/car-historico-panel";
import type { ConectaGovDemonstrativo } from "@/lib/geospatial/conecta-gov-sicar";

const PreviewMap = dynamic(
  () =>
    import("@/components/geospatial/imovel-localizador-preview-map").then(
      (m) => m.ImovelLocalizadorPreviewMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[220px] items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
        Carregando mapa…
      </div>
    ),
  },
);

function selectedImovel(
  localizacao: LocalizacaoResolvida,
  selectedCarCod?: string,
): ImovelSicarResumo | undefined {
  const cod = selectedCarCod || localizacao.imovelSelecionadoCod;
  if (cod) {
    return localizacao.imoveis.find((i) => i.codImovel === cod);
  }
  return localizacao.imoveis[0];
}

function metodoLabel(metodo: string): string {
  switch (metodo) {
    case "car":
      return "Número CAR";
    case "coordinates":
      return "Coordenadas";
    case "gps":
      return "GPS";
    case "polygon":
      return "Polígono";
    default:
      return metodo;
  }
}

export type ImovelLocalizadorConfirmacaoProps = {
  localizacao: LocalizacaoResolvida;
  selectedCarCod?: string;
  onSelectedCarCodChange?: (cod: string) => void;
  /** Utilizador confirmou o imóvel localizado (D2). */
  confirmed?: boolean;
  onConfirm?: () => void;
  /** Re-localizar após mudança de seleção (ambiguidade). */
  onRelocalizar?: () => void;
  isResolving?: boolean;
  disabled?: boolean;
  /**
   * Pacote MG (socioambiental): só confirma se extratoMgAplicavel.
   * Análise geoespacial completa: false — confirma em qualquer UF.
   */
  extratoMgObrigatorioParaConfirmar?: boolean;
  /** Histórico CAR (snapshots Firestore). */
  showCarHistorico?: boolean;
  /** Conecta Gov APP/RL quando credenciais activas. */
  showConectaGov?: boolean;
  onConectaGovLoaded?: (demo: ConectaGovDemonstrativo) => void;
};

export function ImovelLocalizadorConfirmacao({
  localizacao,
  selectedCarCod,
  onSelectedCarCodChange,
  confirmed = false,
  onConfirm,
  onRelocalizar,
  isResolving = false,
  disabled = false,
  extratoMgObrigatorioParaConfirmar = true,
  showCarHistorico = false,
  showConectaGov = true,
  onConectaGovLoaded,
}: ImovelLocalizadorConfirmacaoProps) {
  const imovel = selectedImovel(localizacao, selectedCarCod);
  const showMap =
    localizacao.status === "ok" &&
    localizacao.perimetroFinal?.geometry?.type === "Polygon";

  const podeConfirmar =
    localizacao.status === "ok" &&
    (extratoMgObrigatorioParaConfirmar
      ? localizacao.extratoMgAplicavel
      : true);

  if (localizacao.status === "nao_encontrado") {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="space-y-1">
            <p className="font-medium">Nenhum imóvel CAR encontrado</p>
            <p className="text-xs text-muted-foreground">
              {localizacao.avisos.find((a) => !a.includes("APP e Reserva")) ??
                "Tente outra coordenada, informe o CAR ou desenhe o perímetro no mapa."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (localizacao.status === "ambiguo") {
    return (
      <div className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {localizacao.imoveis.length} imóveis CAR neste local
            </p>
            <p className="text-xs text-muted-foreground">
              Selecione o imóvel correto e clique em Localizar novamente para
              confirmar.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="localizador-car-ambiguo">Imóvel CAR</Label>
          <Select
            value={selectedCarCod || localizacao.imovelSelecionadoCod || ""}
            onValueChange={onSelectedCarCodChange}
            disabled={disabled || isResolving}
          >
            <SelectTrigger id="localizador-car-ambiguo">
              <SelectValue placeholder="Escolha o imóvel" />
            </SelectTrigger>
            <SelectContent>
              {localizacao.imoveis.map((i) => (
                <SelectItem key={i.codImovel} value={i.codImovel}>
                  {i.municipio}/{i.uf} · {i.areaHa.toFixed(1)} ha ·{" "}
                  {i.statusLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {onRelocalizar ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-2"
            disabled={disabled || isResolving || !selectedCarCod}
            onClick={onRelocalizar}
          >
            {isResolving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Localizar novamente
          </Button>
        ) : null}
      </div>
    );
  }

  if (!imovel) return null;

  const portalUrl = buildCarPortalPublicoUrl();
  const demonstrativoUrl = buildCarDemonstrativoUrl(imovel.codImovel);

  return (
    <div className="flex flex-col gap-0 overflow-hidden rounded-lg border bg-card shadow-sm">
      {showMap ? (
        <PreviewMap
          perimetro={localizacao.perimetroFinal as Feature<Polygon>}
          className="rounded-none border-0 border-b"
          height={220}
        />
      ) : null}

      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Imóvel localizado (SICAR)</p>
          {confirmed ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Confirmado
            </Badge>
          ) : (
            <Badge variant="outline">Aguardando confirmação</Badge>
          )}
        </div>

        {!localizacao.extratoMgAplicavel && localizacao.avisoUf ? (
          <div
            className="rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200"
            role="alert"
          >
            {extratoMgObrigatorioParaConfirmar ? (
              <>
                <p className="font-medium">Pacote MG não aplicável (D9)</p>
                <p className="mt-1">{localizacao.avisoUf}</p>
                <Link
                  href="/analise-ambiental"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 font-medium underline underline-offset-2"
                >
                  Análise Geoespacial (IA)
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </>
            ) : (
              <>
                <p className="font-medium">Imóvel fora de Minas Gerais</p>
                <p className="mt-1">
                  Camadas estaduais MG podem não se aplicar; camadas federais (SICAR,
                  IBAMA, PRODES) continuam na análise.
                </p>
              </>
            )}
          </div>
        ) : null}

        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Recibo CAR</dt>
            <dd className="break-all font-mono text-xs">{imovel.codImovel}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Situação</dt>
            <dd>{imovel.situacao}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Área (SICAR)</dt>
            <dd>{localizacao.areaHa.toFixed(2)} ha</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Município / UF</dt>
            <dd>
              {imovel.municipio}/{imovel.uf}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Método</dt>
            <dd>{metodoLabel(localizacao.metodoEntrada)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Confiança</dt>
            <dd>
              {localizacao.confianca}
              {localizacao.gpsAccuracyM != null
                ? ` · GPS ±${Math.round(localizacao.gpsAccuracyM)} m`
                : null}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1" asChild>
            <a href={portalUrl} target="_blank" rel="noopener noreferrer">
              Consulta pública CAR
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-1" asChild>
            <a href={demonstrativoUrl} target="_blank" rel="noopener noreferrer">
              Demonstrativo CAR
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>

        {localizacao.avisos.some((a) => a.includes("APP e Reserva")) ? (
          <p className="text-xs text-muted-foreground">
            APP e Reserva Legal: consulte o demonstrativo no portal CAR ou Conecta Gov
            abaixo quando configurado.
          </p>
        ) : null}

        {showConectaGov && imovel?.codImovel ? (
          <ConectaGovDemonstrativoBlock
            codImovel={imovel.codImovel}
            onLoaded={onConectaGovLoaded}
          />
        ) : null}

        {showCarHistorico && imovel?.codImovel ? (
          <CarHistoricoPanel codImovel={imovel.codImovel} compact={!confirmed} />
        ) : null}
      </div>

      {onConfirm && podeConfirmar && !confirmed ? (
        <div className="sticky bottom-0 border-t bg-card/95 p-3 backdrop-blur supports-[padding:max(0px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            className="w-full gap-2 sm:w-auto"
            disabled={disabled || isResolving}
            onClick={onConfirm}
          >
            <CheckCircle2 className="h-4 w-4" />
            Confirmar imóvel
          </Button>
        </div>
      ) : null}

      {onConfirm && podeConfirmar && confirmed ? (
        <div className="border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
          Imóvel confirmado. Pode executar o pacote socioambiental.
        </div>
      ) : null}
    </div>
  );
}
