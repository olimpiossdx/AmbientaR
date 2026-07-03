"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from "@/firebase";
import { useLocalBranding } from "@/hooks/use-local-branding";
import { collection, addDoc } from "firebase/firestore";
import {
  Loader2,
  Save,
  Play,
  Globe,
  FileDown,
  FileUp,
  ExternalLink,
  X,
  Sparkles,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import type { PerimeterParseInput } from "@/lib/geospatial/perimeter";
import { DEFAULT_INFLUENCE_CONFIG } from "@/lib/geospatial/influence-areas-config";
import { runWaveAAnalysisStreamClient } from "@/lib/geospatial/run-wave-a-stream-client";
import type {
  GeoAnalysisComplementOutput,
  WaveAAnalysisResult,
} from "@/lib/types/geo-wave-a";
import type {
  GlebaSocioambiental,
  RiscoPorGeometria,
} from "@/lib/types/analise-socioambiental";
import { GeoWaveALayerCards } from "@/components/geospatial/geo-wave-a-layer-cards";
import { SocioambientalReportPicker } from "@/components/socioambiental/socioambiental-report-picker";
import { ImovelLocalizadorPanel } from "@/components/geospatial/imovel-localizador-panel";
import {
  localizacaoToPerimeterInput,
} from "@/lib/geospatial/localizacao-imovel-client";
import { saveCarSnapshot, fetchCarSnapshotHistory } from "@/lib/geospatial/car-snapshot-store";
import {
  compareCarSnapshotHistory,
  extractRiscoCamadasFromWave,
  type CarHistoricoAvaliacao,
} from "@/lib/geospatial/car-snapshot-compare";
import { CarHistoricoPanel } from "@/components/geospatial/car-historico-panel";
import type { LocalizacaoResolvida } from "@/lib/types/localizacao-imovel";
import { localizacaoToRequestSnapshot } from "@/lib/geospatial/localizacao-request-snapshot";
import { resolveLayerIdsFromBlocks } from "@/lib/socioambiental/report-blocks-catalog";
import { mapLayersToCriterios } from "@/lib/socioambiental/map-layers-to-criterios";
import { fetchListasAgenteClient } from "@/lib/socioambiental/listas-agente-client";
import { parseBeneficiariosCpr } from "@/lib/socioambiental/listas-agente-parse";
import { uploadSocioambientalPdfExterno } from "@/lib/socioambiental/upload-socioambiental-pdf-externo";
import type { ListasAgenteResult } from "@/lib/socioambiental/listas-agente-types";
import { resolveActiveCriteria } from "@/lib/socioambiental/socioambiental-criteria-catalog";
import { downloadSocioambientalExtratoPdf } from "@/lib/socioambiental/export-socioambiental-pdf";
import { downloadExtratoRiscoPdf } from "@/lib/socioambiental/export-extrato-risco-pdf";
import {
  buildRiscoPorGeometrias,
  needsRiscoPorGeometria,
} from "@/lib/socioambiental/risco-por-geometria";
import { RiscoGeometriaPanel } from "@/components/socioambiental/risco-geometria-panel";
import { AlertasDeduplicadosPanel } from "@/components/socioambiental/alertas-deduplicados-panel";
import { mergeAlertasExtratoCompleto } from "@/lib/socioambiental/merge-relatorio";
import { SESSION_GEO_ANALYSIS_ID } from "@/lib/geospatial/geo-analysis-session";
import { AI_PROVIDER_META, type AiProviderId } from "@/lib/ai-provider-labels";
import { AiProviderBadge } from "@/components/ai/ai-provider-badge";
import {
  criterioBadgeClassName,
  criterioBadgeVariant,
} from "@/lib/socioambiental/criterio-resultado-display";
import {
  blocksForPreset,
  createDefaultWizardState,
  MODO_RELATORIO_OPTIONS,
  modoRelatorioLabel,
  PRESET_ATIVIDADE_OPTIONS,
  WIZARD_STEP_LABELS,
  type GlebaDraft,
  type SocioambientalWizardState,
} from "@/lib/socioambiental/socioambiental-wizard-state";
import {
  computeVereditoGlobal,
  VEREDITO_LABELS,
} from "@/lib/socioambiental/veredito-socioambiental";
import { cn } from "@/lib/utils";

const LeafletMap = dynamic(
  () => import("@/app/(app)/analise-ambiental/leaflet-map"),
  { ssr: false },
);

type GeoJSONLike = { type: string; [key: string]: unknown };

function newGlebaId(): string {
  return `gleba-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function buildPerimeterInput(
  state: SocioambientalWizardState,
  drawnPolygon: GeoJSONLike | null,
): PerimeterParseInput | null {
  if (state.tipoPerimetro === "car_rural" && state.carNumber.trim().length > 3) {
    return { dataType: "car", data: state.carNumber.trim() };
  }
  const poly = drawnPolygon
    ? JSON.stringify(drawnPolygon)
    : state.polygonInput.trim();
  if (state.tipoPerimetro === "poligono_operacao" && poly.length > 3) {
    return { dataType: "polygon", data: poly };
  }
  return null;
}

export function SocioambientalExecucaoWizard() {
  const { auth, firestore, user } = useFirebase();
  const { toast } = useToast();
  const brandingCtx = useLocalBranding();

  const [wizard, setWizard] = React.useState<SocioambientalWizardState>(
    createDefaultWizardState,
  );
  const [drawnPolygon, setDrawnPolygon] = React.useState<GeoJSONLike | null>(
    null,
  );
  const [iaProvider, setIaProvider] = React.useState<AiProviderId>("gemini");
  const [complement, setComplement] =
    React.useState<GeoAnalysisComplementOutput | null>(null);
  const [complementProvider, setComplementProvider] =
    React.useState<AiProviderId | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);
  const [isGeneratingIa, setIsGeneratingIa] = React.useState(false);
  const [layersDone, setLayersDone] = React.useState(0);
  const [layersTotal, setLayersTotal] = React.useState(0);
  const [waveResult, setWaveResult] = React.useState<WaveAAnalysisResult | null>(
    null,
  );
  const [isSaving, setIsSaving] = React.useState(false);
  const [isExportingPdf, setIsExportingPdf] = React.useState(false);
  const [localizacao, setLocalizacao] =
    React.useState<LocalizacaoResolvida | null>(null);
  const [localizacaoConfirmada, setLocalizacaoConfirmada] = React.useState(false);
  const [carHistoricoAvaliacao, setCarHistoricoAvaliacao] =
    React.useState<CarHistoricoAvaliacao | null>(null);
  const [listasAgente, setListasAgente] =
    React.useState<ListasAgenteResult | null>(null);
  const [isConsultandoListas, setIsConsultandoListas] = React.useState(false);
  const [riscoPorGeometria, setRiscoPorGeometria] = React.useState<
    RiscoPorGeometria[] | null
  >(null);
  const [isUploadingPdfExterno, setIsUploadingPdfExterno] = React.useState(false);
  const pdfExternoInputRef = React.useRef<HTMLInputElement>(null);

  const patch = React.useCallback(
    (partial: Partial<SocioambientalWizardState>) => {
      setWizard((prev) => ({ ...prev, ...partial }));
    },
    [],
  );

  const ufExecucao = React.useMemo(() => {
    const imovel =
      localizacao?.imoveis.find(
        (i) => i.codImovel === localizacao.imovelSelecionadoCod,
      ) ?? localizacao?.imoveis[0];
    return imovel?.uf ?? "MG";
  }, [localizacao]);

  const layerIds = React.useMemo(
    () =>
      resolveLayerIdsFromBlocks(
        wizard.selectedBlocks,
        wizard.prodesModo,
        ufExecucao,
      ),
    [wizard.selectedBlocks, wizard.prodesModo, ufExecucao],
  );

  const listaCriterioIds = React.useMemo(
    () =>
      resolveActiveCriteria({
        blockIds: wizard.selectedBlocks,
        prodesModo: wizard.prodesModo,
        uf: ufExecucao,
      })
        .filter((c) => c.tipoConsulta === "lista")
        .map((c) => c.id),
    [wizard.selectedBlocks, wizard.prodesModo, ufExecucao],
  );

  const criterios = React.useMemo(() => {
    if (!waveResult) return null;
    return mapLayersToCriterios(waveResult.layers, wizard.selectedBlocks, {
      prodesModo: wizard.prodesModo,
      uf: ufExecucao,
      carHistorico: carHistoricoAvaliacao,
      listasAgente,
    });
  }, [
    waveResult,
    wizard.selectedBlocks,
    wizard.prodesModo,
    ufExecucao,
    carHistoricoAvaliacao,
    listasAgente,
  ]);

  const alertasUnificados = React.useMemo(() => {
    if (wizard.modoRelatorio !== "extrato_completo" || !criterios) return null;
    return mergeAlertasExtratoCompleto({
      criteriosResultados: criterios.criteriosResultados,
      riscoPorGeometria: riscoPorGeometria ?? undefined,
      carHistorico: carHistoricoAvaliacao,
      listasAgente,
      imovelRotulo: wizard.tituloExtrato.trim() || "Imóvel rural",
    });
  }, [
    wizard.modoRelatorio,
    wizard.tituloExtrato,
    criterios,
    riscoPorGeometria,
    carHistoricoAvaliacao,
    listasAgente,
  ]);

  const veredito = React.useMemo(() => {
    if (!criterios) return null;
    return computeVereditoGlobal(criterios.criteriosResultados);
  }, [criterios]);

  const busy = isRunning || isGeneratingIa || isConsultandoListas;
  const isLastStep = wizard.step === WIZARD_STEP_LABELS.length - 1;

  const canAdvance = React.useMemo(() => {
    if (wizard.step === 1) {
      if (wizard.tipoPerimetro === "car_rural") {
        return (
          localizacaoConfirmada &&
          localizacao?.status === "ok" &&
          localizacao.extratoMgAplicavel
        );
      }
      const poly = drawnPolygon
        ? JSON.stringify(drawnPolygon)
        : wizard.polygonInput.trim();
      return poly.length > 3;
    }
    if (wizard.step === 3) {
      return wizard.selectedBlocks.length > 0;
    }
    return true;
  }, [wizard, drawnPolygon, localizacao, localizacaoConfirmada]);

  const canExecutePacote = React.useMemo(() => {
    if (wizard.tipoPerimetro !== "car_rural") return true;
    return (
      localizacaoConfirmada &&
      localizacao?.status === "ok" &&
      localizacao.extratoMgAplicavel
    );
  }, [wizard.tipoPerimetro, localizacao, localizacaoConfirmada]);

  const handleLocalizacaoConfirmed = React.useCallback(
    (resolved: LocalizacaoResolvida) => {
      setLocalizacao(resolved);
      setLocalizacaoConfirmada(true);
      setCarHistoricoAvaliacao(null);
      const imovel =
        resolved.imoveis.find((i) => i.codImovel === resolved.imovelSelecionadoCod) ??
        resolved.imoveis[0];
      const cod = resolved.imovelSelecionadoCod ?? imovel?.codImovel ?? "";
      const tituloAuto =
        imovel?.municipio && imovel.uf
          ? `Extrato — ${imovel.municipio}/${imovel.uf}`
          : "";
      patch({
        carNumber: cod,
        tituloExtrato: wizard.tituloExtrato.trim() || tituloAuto,
      });
      if (firestore && cod) {
        void fetchCarSnapshotHistory(firestore, cod, 10).then((records) => {
          setCarHistoricoAvaliacao(compareCarSnapshotHistory(records, cod));
        });
      }
    },
    [patch, wizard.tituloExtrato, firestore],
  );

  const handleLocalizacaoCleared = React.useCallback(() => {
    setLocalizacao(null);
    setLocalizacaoConfirmada(false);
    setCarHistoricoAvaliacao(null);
  }, []);

  React.useEffect(() => {
    if (wizard.tipoPerimetro !== "car_rural") {
      setLocalizacao(null);
      setLocalizacaoConfirmada(false);
      setCarHistoricoAvaliacao(null);
    }
  }, [wizard.tipoPerimetro]);

  const handlePresetChange = (preset: SocioambientalWizardState["presetAtividade"]) => {
    const opt = PRESET_ATIVIDADE_OPTIONS.find((p) => p.id === preset);
    patch({
      presetAtividade: preset,
      tipoPerimetro: opt?.suggestedTipo ?? wizard.tipoPerimetro,
      selectedBlocks:
        preset === "protocolo_personalizado"
          ? wizard.selectedBlocks
          : blocksForPreset(preset),
    });
  };

  const addGleba = () => {
    patch({
      glebas: [
        ...wizard.glebas,
        {
          id: newGlebaId(),
          rotulo: `Gleba ${wizard.glebas.length + 1}`,
          geojsonText: "",
        },
      ],
    });
  };

  const updateGleba = (id: string, partial: Partial<GlebaDraft>) => {
    patch({
      glebas: wizard.glebas.map((g) =>
        g.id === id ? { ...g, ...partial } : g,
      ),
    });
  };

  const removeGleba = (id: string) => {
    patch({ glebas: wizard.glebas.filter((g) => g.id !== id) });
  };

  const handlePdfExternoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!auth?.currentUser) {
      toast({ variant: "destructive", title: "Faça login para enviar o PDF." });
      return;
    }
    setIsUploadingPdfExterno(true);
    try {
      const url = await uploadSocioambientalPdfExterno({
        file,
        userId: auth.currentUser.uid,
        user: user ?? undefined,
      });
      patch({ pdfExternoUrl: url });
      toast({
        title: "PDF enviado",
        description: "O anexo ficará vinculado ao extrato ao salvar.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Falha no upload",
        description:
          error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setIsUploadingPdfExterno(false);
    }
  };

  const generateComplement = async (result: WaveAAnalysisResult) => {
    if (!auth?.currentUser) return;
    setIsGeneratingIa(true);
    setComplement(null);
    setComplementProvider(null);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/geo-analyses/complement", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          geoAnalysisId: SESSION_GEO_ANALYSIS_ID,
          waveResult: result,
          provider: iaProvider,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        result?: GeoAnalysisComplementOutput;
        provider?: AiProviderId;
      };
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setComplement(data.result ?? null);
      setComplementProvider(data.provider ?? iaProvider);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Parecer IA não gerado",
        description:
          error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setIsGeneratingIa(false);
    }
  };

  const handleRun = async () => {
    let perimeterInput: PerimeterParseInput | null = null;
    if (wizard.tipoPerimetro === "car_rural") {
      if (!localizacao || !localizacaoConfirmada || localizacao.status !== "ok") {
        toast({
          variant: "destructive",
          title: "Confirme o imóvel",
          description: "Localize e confirme o CAR antes de executar o pacote MG.",
        });
        return;
      }
      if (!localizacao.extratoMgAplicavel) {
        toast({
          variant: "destructive",
          title: "Pacote MG indisponível",
          description:
            localizacao.avisoUf ??
            "Imóvel fora de MG. Use Análise Geoespacial para consulta nacional.",
        });
        return;
      }
      perimeterInput = localizacaoToPerimeterInput(localizacao);
    } else {
      perimeterInput = buildPerimeterInput(wizard, drawnPolygon);
    }
    if (!perimeterInput) {
      toast({
        variant: "destructive",
        title: "Perímetro obrigatório",
        description:
          wizard.tipoPerimetro === "car_rural"
            ? "Informe o número do CAR."
            : "Desenhe ou cole o polígono da operação.",
      });
      return;
    }
    if (!auth?.currentUser) {
      toast({ variant: "destructive", title: "Faça login para continuar." });
      return;
    }

    setIsRunning(true);
    setWaveResult(null);
    setRiscoPorGeometria(null);
    setListasAgente(null);
    setComplement(null);
    setLayersDone(0);
    setLayersTotal(layerIds.length);

    try {
      const token = await auth.currentUser.getIdToken();
      const result = await runWaveAAnalysisStreamClient(
        token,
        perimeterInput,
        DEFAULT_INFLUENCE_CONFIG,
        (event) => {
          if (event.type === "layer") {
            setLayersDone(event.index + 1);
            setLayersTotal(event.total);
          }
        },
        { layerIds },
      );
      setWaveResult(result);

      const docAgente = wizard.agenteDocumento.replace(/\D/g, "");
      const beneficiarios = parseBeneficiariosCpr(wizard.beneficiariosCpr);
      const codImovelLista =
        wizard.tipoPerimetro === "car_rural"
          ? wizard.carNumber.trim()
          : undefined;
      const deveConsultarListas =
        listaCriterioIds.length > 0 &&
        (docAgente.length >= 11 ||
          Boolean(codImovelLista) ||
          beneficiarios.length > 0);
      if (deveConsultarListas) {
        setIsConsultandoListas(true);
        try {
          const lista = await fetchListasAgenteClient(token, {
            documento: docAgente,
            criterioIds: listaCriterioIds,
            codImovel: codImovelLista,
            beneficiariosCpr: beneficiarios.length ? beneficiarios : undefined,
          });
          setListasAgente(lista);
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Listas CPF/CNPJ",
            description:
              error instanceof Error
                ? error.message
                : "Falha na consulta por documento.",
          });
        } finally {
          setIsConsultandoListas(false);
        }
      }

      if (needsRiscoPorGeometria(wizard.modoRelatorio)) {
        const validGlebas = wizard.glebas.filter(
          (g) => g.geojsonText.trim().length > 10,
        );
        const glebaWaves: {
          id: string;
          rotulo: string;
          wave: WaveAAnalysisResult;
        }[] = [];
        for (const g of validGlebas) {
          try {
            const glebaResult = await runWaveAAnalysisStreamClient(
              token,
              { dataType: "polygon", data: g.geojsonText.trim() },
              DEFAULT_INFLUENCE_CONFIG,
              () => {},
              { layerIds },
            );
            glebaWaves.push({ id: g.id, rotulo: g.rotulo, wave: glebaResult });
          } catch (glebaErr) {
            toast({
              variant: "destructive",
              title: `Falha na gleba ${g.rotulo}`,
              description:
                glebaErr instanceof Error
                  ? glebaErr.message
                  : "GeoJSON inválido ou consulta indisponível.",
            });
          }
        }
        setRiscoPorGeometria(
          buildRiscoPorGeometrias({
            imovelWave: result,
            imovelRotulo: wizard.tituloExtrato.trim() || "Imóvel rural",
            glebas: glebaWaves,
          }),
        );
      }

      if (localizacao && auth.currentUser && firestore) {
        const cod =
          localizacao.imovelSelecionadoCod ??
          localizacao.imoveis[0]?.codImovel ??
          "";
        const riscoCamadas = extractRiscoCamadasFromWave(result.layers);
        try {
          await saveCarSnapshot(firestore, localizacao, {
            source: "socioambiental_executar",
            createdBy: auth.currentUser.uid,
            riscoCamadas,
          });
          if (cod) {
            const records = await fetchCarSnapshotHistory(firestore, cod, 10);
            setCarHistoricoAvaliacao(
              compareCarSnapshotHistory(records, cod),
            );
          }
        } catch (e) {
          console.warn("car_snapshots:", e);
        }
      }
      toast({
        title: "Pacote concluído",
        description: `${result.layers.length} camada(s) consultada(s).`,
      });
      if (wizard.includeParecerIa) await generateComplement(result);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Falha na consulta",
        description:
          error instanceof Error ? error.message : "Erro na execução.",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const glebasForSave = (): GlebaSocioambiental[] =>
    wizard.glebas
      .filter((g) => g.geojsonText.trim().length > 10)
      .map((g) => ({
        id: g.id,
        rotulo: g.rotulo,
        geojson: g.geojsonText.trim(),
      }));

  const handleSave = async () => {
    if (!firestore || !auth?.currentUser || !waveResult || !criterios) return;
    setIsSaving(true);
    try {
      const titulo =
        wizard.tituloExtrato.trim() ||
        `${modoRelatorioLabel(wizard.modoRelatorio)} — ${new Date().toLocaleDateString("pt-BR")}`;
      const vereditoGlobal = computeVereditoGlobal(criterios.criteriosResultados);
      const locSnap =
        localizacao && localizacaoConfirmada
          ? localizacaoToRequestSnapshot(localizacao)
          : null;
      await addDoc(collection(firestore, "analisesSocioambientais"), {
        titulo,
        dataEmissao: new Date().toISOString().slice(0, 10),
        modoRelatorio: wizard.modoRelatorio,
        vereditoGlobal,
        tipoPerimetro: wizard.tipoPerimetro,
        presetAtividade: wizard.presetAtividade,
        prodesModo: wizard.prodesModo,
        informacoesPropriedade: {
          areaCalculadaHa: waveResult.perimeter.areaHa,
          cardoc:
            wizard.tipoPerimetro === "car_rural"
              ? wizard.carNumber.trim()
              : undefined,
          nome: wizard.tituloExtrato || undefined,
          municipio: locSnap?.municipio,
          uf: locSnap?.uf,
          metodoLocalizacao: locSnap?.metodoEntrada,
          perimetroFonte: locSnap?.perimetroFonte,
          confiancaLocalizacao: locSnap?.confianca,
          carResolvidoAutomaticamente:
            locSnap?.metodoEntrada === "coordinates" ||
            locSnap?.metodoEntrada === "gps",
          gpsAccuracyM: locSnap?.gpsAccuracyM,
        },
        agentes:
          wizard.agenteNome.trim() || wizard.agenteDocumento.trim()
            ? [
                {
                  nome: wizard.agenteNome.trim(),
                  documento: wizard.agenteDocumento.replace(/\D/g, ""),
                  tipoAgente: "TOMADOR",
                },
              ]
            : [],
        glebas: glebasForSave(),
        criteriosResultados: criterios.criteriosResultados,
        detalhesAnalise: criterios.detalhesAnalise,
        pacoteBlocos: wizard.selectedBlocks,
        resumoCriterios: {
          apto: criterios.criteriosResultados.filter((c) => c.resultado === "Apto")
            .length,
          alerta: criterios.criteriosResultados.filter(
            (c) => c.resultado === "Alerta",
          ).length,
          inapto: criterios.criteriosResultados.filter(
            (c) => c.resultado === "Inapto",
          ).length,
          naoAnalisado: criterios.criteriosResultados.filter(
            (c) => c.resultado === "Não Analisado",
          ).length,
        },
        ...(complement
          ? {
              parecerIaResumo: complement.resumoExecutivo,
              parecerIaProvider: complementProvider,
            }
          : {}),
        ...(riscoPorGeometria?.length
          ? { riscoPorGeometria }
          : {}),
        ...(wizard.modoRelatorio === "extrato_completo" &&
        alertasUnificados != null
          ? { alertasUnificados }
          : {}),
        ...(wizard.pdfExternoUrl.trim()
          ? { pdfUrl: wizard.pdfExternoUrl.trim() }
          : {}),
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser.uid,
        updatedAt: new Date().toISOString(),
      });
      toast({ title: "Extrato salvo" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPdf = async () => {
    if (!waveResult || !criterios) return;
    setIsExportingPdf(true);
    try {
      const titulo =
        wizard.tituloExtrato.trim() ||
        modoRelatorioLabel(wizard.modoRelatorio);
      const pdfBranding = {
        brandingData: brandingCtx.data,
        pdfImages: brandingCtx.pdfImages,
        isPdfImagesLoading: brandingCtx.isPdfImagesLoading,
        hasBrandingUrls: brandingCtx.hasBrandingUrls,
        toast,
      };
      const risco =
        riscoPorGeometria ??
        (needsRiscoPorGeometria(wizard.modoRelatorio)
          ? buildRiscoPorGeometrias({
              imovelWave: waveResult,
              imovelRotulo: titulo || "Imóvel rural",
              glebas: [],
            })
          : null);

      let ok = false;
      if (wizard.modoRelatorio === "extrato_risco_socioambiental" && risco) {
        ok = await downloadExtratoRiscoPdf(
          {
            titulo,
            dataEmissao: new Date().toISOString().slice(0, 10),
            car:
              wizard.tipoPerimetro === "car_rural"
                ? wizard.carNumber.trim()
                : undefined,
            agenteNome: wizard.agenteNome.trim() || undefined,
            agenteDocumento: wizard.agenteDocumento.trim() || undefined,
            vereditoGlobal: veredito ?? undefined,
            riscoPorGeometria: risco,
            carHistorico: carHistoricoAvaliacao,
            listasAgente,
            wave: waveResult,
          },
          pdfBranding,
        );
      } else {
        ok = await downloadSocioambientalExtratoPdf(
          {
            titulo,
            dataEmissao: new Date().toISOString().slice(0, 10),
            areaHa: waveResult.perimeter.areaHa,
            car:
              wizard.tipoPerimetro === "car_rural"
                ? wizard.carNumber.trim()
                : undefined,
            biomaLabel: PRESET_ATIVIDADE_OPTIONS.find(
              (p) => p.id === wizard.presetAtividade,
            )?.label,
            pacoteBlocos: wizard.selectedBlocks,
            modoRelatorio: wizard.modoRelatorio,
            vereditoGlobal: veredito ?? undefined,
            prodesModo: wizard.prodesModo,
            criteriosResultados: criterios.criteriosResultados,
            detalhesAnalise: criterios.detalhesAnalise,
            layers: waveResult.layers,
            wave: waveResult,
            riscoPorGeometria:
              wizard.modoRelatorio === "extrato_completo"
                ? (risco ?? undefined)
                : undefined,
            alertasUnificados:
              wizard.modoRelatorio === "extrato_completo"
                ? (alertasUnificados ?? undefined)
                : undefined,
            carHistorico: carHistoricoAvaliacao,
            listasAgente,
            pdfExternoUrl: wizard.pdfExternoUrl.trim() || undefined,
            complement,
          },
          pdfBranding,
        );
      }
      if (ok) toast({ title: "PDF exportado" });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const renderStep = () => {
    switch (wizard.step) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Modo de relatório</Label>
              <RadioGroup
                value={wizard.modoRelatorio}
                onValueChange={(v) =>
                  patch({
                    modoRelatorio:
                      v as SocioambientalWizardState["modoRelatorio"],
                  })
                }
                className="grid gap-3"
              >
                {MODO_RELATORIO_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className={cn(
                      "flex cursor-pointer gap-3 rounded-lg border p-3",
                      wizard.modoRelatorio === opt.id && "border-primary bg-primary/5",
                    )}
                  >
                    <RadioGroupItem value={opt.id} className="mt-1" />
                    <span>
                      <span className="block text-sm font-medium">{opt.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {opt.description}
                      </span>
                    </span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Preset de atividade</Label>
              <Select
                value={wizard.presetAtividade}
                onValueChange={(v) =>
                  handlePresetChange(
                    v as SocioambientalWizardState["presetAtividade"],
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_ATIVIDADE_OPTIONS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>PRODES no extrato</Label>
              <Select
                value={wizard.prodesModo}
                onValueChange={(v) =>
                  patch({ prodesModo: v as SocioambientalWizardState["prodesModo"] })
                }
              >
                <SelectTrigger className="max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agregado">
                    Agregado (qualquer ano por bioma)
                  </SelectItem>
                  <SelectItem value="por_ano">
                    Por ano (protocolo estrito)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="titulo">Título do extrato</Label>
              <Input
                id="titulo"
                placeholder="Nome da operação / propriedade"
                value={wizard.tituloExtrato}
                onChange={(e) => patch({ tituloExtrato: e.target.value })}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Tipo de perímetro</Label>
              <Select
                value={wizard.tipoPerimetro}
                onValueChange={(v) =>
                  patch({
                    tipoPerimetro:
                      v as SocioambientalWizardState["tipoPerimetro"],
                  })
                }
              >
                <SelectTrigger className="max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="car_rural">
                    CAR rural (recomendado para crédito)
                  </SelectItem>
                  <SelectItem value="poligono_operacao">
                    Polígono da operação (empreendimento / obra)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {wizard.tipoPerimetro === "car_rural" ? (
              <ImovelLocalizadorPanel
                initialCarCod={wizard.carNumber}
                showCarHistorico
                extratoMgObrigatorioParaConfirmar
                disabled={busy}
                panelTitle="Localizar imóvel rural (CAR / GPS / coordenadas)"
                panelDescription="Localize no SICAR, confirme o imóvel em MG e avance. O pacote usa a geometria oficial do CAR."
                onConfirmed={handleLocalizacaoConfirmed}
                onCleared={handleLocalizacaoCleared}
              />
            ) : null}
            {wizard.tipoPerimetro === "car_rural" &&
            localizacaoConfirmada &&
            wizard.carNumber.trim() ? (
              <CarHistoricoPanel
                codImovel={wizard.carNumber.trim()}
                avaliacao={carHistoricoAvaliacao}
              />
            ) : null}
            {wizard.tipoPerimetro === "poligono_operacao" ? (
              <div className="space-y-3">
                <div className="h-[260px] overflow-hidden rounded-lg border">
                  <LeafletMap
                    adaPolygon={drawnPolygon}
                    onAdaChange={setDrawnPolygon}
                  />
                </div>
                <Textarea
                  placeholder="GeoJSON do perímetro da operação"
                  value={wizard.polygonInput}
                  onChange={(e) => patch({ polygonInput: e.target.value })}
                  rows={3}
                />
              </div>
            ) : null}

            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">Glebas vinculadas (opcional)</p>
                  <p className="text-xs text-muted-foreground">
                    CPR, talhões ou áreas contratuais — usadas no Extrato Risco.
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addGleba}>
                  <Plus className="h-4 w-4 mr-1" />
                  Gleba
                </Button>
              </div>
              {wizard.glebas.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhuma gleba. Adicione se o financiamento tiver áreas parciais.
                </p>
              ) : (
                wizard.glebas.map((g) => (
                  <div key={g.id} className="space-y-2 rounded-md border p-3">
                    <div className="flex gap-2">
                      <Input
                        value={g.rotulo}
                        onChange={(e) =>
                          updateGleba(g.id, { rotulo: e.target.value })
                        }
                        placeholder="Nome da gleba"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeGleba(g.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={g.geojsonText}
                      onChange={(e) =>
                        updateGleba(g.id, { geojsonText: e.target.value })
                      }
                      placeholder='GeoJSON Polygon ou Feature'
                      rows={2}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Necessário para listas (trabalho escravo, embargos por CPF/CNPJ,
              reserva legal). Pode deixar em branco se só consultar o território.
            </p>
            <div className="space-y-1">
              <Label>Nome do agente / tomador</Label>
              <Input
                value={wizard.agenteNome}
                onChange={(e) => patch({ agenteNome: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>CPF ou CNPJ</Label>
              <Input
                value={wizard.agenteDocumento}
                onChange={(e) => patch({ agenteDocumento: e.target.value })}
                placeholder="Somente números"
              />
            </div>
            {(wizard.modoRelatorio === "extrato_risco_socioambiental" ||
              wizard.modoRelatorio === "extrato_completo") && (
              <div className="space-y-1">
                <Label>Beneficiários CPR (opcional)</Label>
                <Textarea
                  value={wizard.beneficiariosCpr}
                  onChange={(e) =>
                    patch({ beneficiariosCpr: e.target.value })
                  }
                  placeholder="CPF/CNPJ por linha ou separados por vírgula"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Consulta listas MTE, IBAMA e ICMBio para cada beneficiário.
                </p>
              </div>
            )}
            <div className="space-y-2 rounded-lg border p-3">
              <Label>PDF externo (opcional)</Label>
              <p className="text-xs text-muted-foreground">
                Extrato de cooperativa ou terceiros — envie para o Storage ou
                cole uma URL pública.
              </p>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={pdfExternoInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  aria-label="Selecionar PDF externo para upload"
                  onChange={(e) => void handlePdfExternoUpload(e)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={isUploadingPdfExterno}
                  onClick={() => pdfExternoInputRef.current?.click()}
                >
                  {isUploadingPdfExterno ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileUp className="h-4 w-4" />
                  )}
                  Enviar PDF
                </Button>
                {wizard.pdfExternoUrl.trim() ? (
                  <>
                    <Button variant="ghost" size="sm" className="gap-2" asChild>
                      <a
                        href={wizard.pdfExternoUrl.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Abrir anexo
                      </a>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-muted-foreground"
                      onClick={() => patch({ pdfExternoUrl: "" })}
                    >
                      <X className="h-4 w-4" />
                      Remover
                    </Button>
                  </>
                ) : null}
              </div>
              <Input
                value={wizard.pdfExternoUrl}
                onChange={(e) => patch({ pdfExternoUrl: e.target.value })}
                placeholder="Ou cole URL (https://…)"
              />
            </div>
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <Checkbox
                id="ia-parecer"
                checked={wizard.includeParecerIa}
                onCheckedChange={(v) => patch({ includeParecerIa: v === true })}
              />
              <Label htmlFor="ia-parecer" className="cursor-pointer text-sm">
                Incluir parecer técnico (IA) após a consulta — não altera
                critérios.
              </Label>
            </div>
            {wizard.includeParecerIa && (
              <Select
                value={iaProvider}
                onValueChange={(v) => setIaProvider(v as AiProviderId)}
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(AI_PROVIDER_META) as AiProviderId[]).map(
                    (id) => (
                      <SelectItem key={id} value={id}>
                        {AI_PROVIDER_META[id].label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
        );

      case 3:
        return (
          <SocioambientalReportPicker
            selected={wizard.selectedBlocks}
            onChange={(ids) => patch({ selectedBlocks: ids })}
            disabled={busy}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Novo pacote socioambiental</CardTitle>
          <CardDescription>
            Assistente em {WIZARD_STEP_LABELS.length} passos. Análise geoespacial
            completa em{" "}
            <Link href="/analise-ambiental" className="text-primary underline">
              Análise Geoespacial (IA)
            </Link>
            .
          </CardDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            {WIZARD_STEP_LABELS.map((label, i) => (
              <Badge
                key={label}
                variant={wizard.step === i ? "default" : "outline"}
                className="text-xs"
              >
                {i + 1}. {label}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderStep()}

          <div className="flex flex-wrap justify-between gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={wizard.step === 0 || busy}
              onClick={() => patch({ step: wizard.step - 1 })}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            {!isLastStep ? (
              <Button
                type="button"
                disabled={!canAdvance || busy}
                onClick={() => patch({ step: wizard.step + 1 })}
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                disabled={
                  busy ||
                  wizard.selectedBlocks.length === 0 ||
                  !canAdvance ||
                  !canExecutePacote
                }
                onClick={() => void handleRun()}
                className="gap-2"
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isRunning
                  ? `Consultando (${layersDone}/${layersTotal})…`
                  : isConsultandoListas
                    ? "Consultando listas CPF/CNPJ…"
                    : `Executar (${layerIds.length} camadas)`}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {criterios && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">Resultado</CardTitle>
                <CardDescription>
                  {modoRelatorioLabel(wizard.modoRelatorio)}
                  {veredito ? ` · ${VEREDITO_LABELS[veredito]}` : ""}
                  {waveResult
                    ? ` · ${waveResult.perimeter.areaHa.toFixed(2)} ha`
                    : ""}
                  {listasAgente
                    ? ` · Listas: ${listasAgente.documentoMascarado}`
                    : ""}
                  {isConsultandoListas ? " · consultando listas…" : ""}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={isExportingPdf}
                  onClick={() => void handleExportPdf()}
                >
                  {isExportingPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4" />
                  )}
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={isSaving}
                  onClick={() => void handleSave()}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {criterios.criteriosResultados.map((c) => (
              <div
                key={c.criterio}
                className="flex flex-wrap items-start justify-between gap-2 rounded-md border p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{c.criterio}</p>
                  {c.detalhe ? (
                    <p className="text-xs text-muted-foreground">{c.detalhe}</p>
                  ) : null}
                </div>
                <Badge
                  variant={criterioBadgeVariant(c.resultado)}
                  className={criterioBadgeClassName(c.resultado)}
                >
                  {c.resultado}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {riscoPorGeometria?.length ? (
        <RiscoGeometriaPanel geometrias={riscoPorGeometria} />
      ) : null}

      {alertasUnificados ? (
        <AlertasDeduplicadosPanel alertas={alertasUnificados} />
      ) : null}

      {complement && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Parecer IA
              {complementProvider ? (
                <AiProviderBadge provider={complementProvider} />
              ) : null}
            </CardTitle>
            <CardDescription>{complement.resumoExecutivo}</CardDescription>
          </CardHeader>
          <CardContent>
            {complement.sections.map((s) => (
              <Collapsible key={s.key}>
                <CollapsibleTrigger className="flex w-full justify-between border rounded-md px-3 py-2 text-sm">
                  {s.title}
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
                  {s.bodyMarkdown}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </CardContent>
        </Card>
      )}

      {waveResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Camadas consultadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {wizard.tipoPerimetro === "car_rural" && wizard.carNumber.trim() ? (
              <CarHistoricoPanel
                codImovel={wizard.carNumber.trim()}
                avaliacao={carHistoricoAvaliacao}
              />
            ) : null}
            <GeoWaveALayerCards layers={waveResult.layers} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
