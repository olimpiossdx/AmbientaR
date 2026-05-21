"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileDown, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from "@/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  serverTimestamp,
  where,
  limit,
} from "firebase/firestore";
import type {
  GeoAnalysisComplementOutput,
  WaveAAnalysisResult,
} from "@/lib/types/geo-wave-a";
import { handleGeoAnalysisComplement } from "@/app/(app)/analise-ambiental/actions-complement";
import {
  brandingUrlsFromLocal,
  createMmBrandedPdfSession,
  drawWatermarkOnPage,
} from "@/lib/pdf-branding-layout";
import { useLocalBranding } from "@/hooks/use-local-branding";
import { buildComplementDocxBlob } from "@/lib/geospatial/export-complement-docx";

type GeoAnalysisDoc = {
  id: string;
  wave?: string;
  factualSummary?: string;
  perimeter?: WaveAAnalysisResult["perimeter"];
  layers?: WaveAAnalysisResult["layers"];
  generatedAtUtc?: string;
  createdAt?: unknown;
};

function downloadBlob(fileName: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export function GeoAnalysisComplementPanel({
  userId,
  initialGeoAnalysisId,
  inlineWaveResult,
}: {
  userId: string;
  initialGeoAnalysisId?: string | null;
  inlineWaveResult?: WaveAAnalysisResult | null;
}) {
  const { firestore } = useFirebase();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { data: brandingData } = useLocalBranding();
  const [analyses, setAnalyses] = React.useState<GeoAnalysisDoc[]>([]);
  const [selectedId, setSelectedId] = React.useState<string>("");
  const [loadedWave, setLoadedWave] = React.useState<WaveAAnalysisResult | null>(
    null,
  );
  const [complement, setComplement] =
    React.useState<GeoAnalysisComplementOutput | null>(null);
  const [loadingList, setLoadingList] = React.useState(true);
  const [loadingDoc, setLoadingDoc] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [exportingPdf, setExportingPdf] = React.useState(false);
  const [exportingDocx, setExportingDocx] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      if (!firestore || !userId) {
        setLoadingList(false);
        return;
      }
      try {
        const snap = await getDocs(
          query(
            collection(firestore, "geo_analyses"),
            where("createdBy", "==", userId),
            limit(30),
          ),
        );
        const items = snap.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as Omit<GeoAnalysisDoc, "id">),
          }))
          .filter((a) => a.wave === "A" || a.wave === "ABC")
          .slice(0, 20);
        setAnalyses(items);
        const fromUrl = searchParams?.get("geoAnalysisId");
        if (fromUrl && items.some((i) => i.id === fromUrl)) {
          setSelectedId(fromUrl);
        } else if (initialGeoAnalysisId && items.some((i) => i.id === initialGeoAnalysisId)) {
          setSelectedId(initialGeoAnalysisId);
        } else if (items[0]) {
          setSelectedId(items[0].id);
        }
      } catch (e) {
        console.error(e);
        toast({
          variant: "destructive",
          title: "Erro ao listar análises",
          description:
            "Verifique índice Firestore (createdBy + wave + createdAt) ou permissões.",
        });
      } finally {
        setLoadingList(false);
      }
    };
    void load();
  }, [firestore, userId, searchParams, toast, initialGeoAnalysisId]);

  React.useEffect(() => {
    if (inlineWaveResult && initialGeoAnalysisId) {
      setLoadedWave(inlineWaveResult);
      setSelectedId(initialGeoAnalysisId);
    }
  }, [inlineWaveResult, initialGeoAnalysisId]);

  React.useEffect(() => {
    const loadOne = async () => {
      if (inlineWaveResult && selectedId === initialGeoAnalysisId) {
        setLoadedWave(inlineWaveResult);
        return;
      }
      if (!firestore || !selectedId) {
        setLoadedWave(null);
        return;
      }
      setLoadingDoc(true);
      setComplement(null);
      try {
        const snap = await getDoc(doc(firestore, "geo_analyses", selectedId));
        if (!snap.exists()) {
          setLoadedWave(null);
          return;
        }
        const data = snap.data();
        if ((data.wave !== "A" && data.wave !== "ABC") || !data.perimeter || !data.layers) {
          setLoadedWave(null);
          return;
        }
        setLoadedWave({
          wave: data.wave === "ABC" ? "ABC" : "A",
          generatedAtUtc: data.generatedAtUtc ?? new Date().toISOString(),
          perimeter: data.perimeter,
          layers: data.layers,
          factualSummary: data.factualSummary ?? "",
          fontesConsultadas: data.fontesConsultadas ?? [],
        });
      } finally {
        setLoadingDoc(false);
      }
    };
    void loadOne();
  }, [firestore, selectedId, inlineWaveResult, initialGeoAnalysisId]);

  const handleGenerateComplement = async () => {
    if (!loadedWave || !selectedId) return;
    setGenerating(true);
    try {
      const result = await handleGeoAnalysisComplement({
        geoAnalysisId: selectedId,
        waveResult: loadedWave,
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      setComplement(result.result);
      if (firestore && userId) {
        const { geoAnalysisId: _gid, ...complementFields } = result.result;
        await addDoc(collection(firestore, "geo_analysis_complements"), {
          createdAt: serverTimestamp(),
          createdBy: userId,
          geoAnalysisId: selectedId,
          ...complementFields,
        });
      }
      toast({
        title: "Complemento gerado",
        description: "Rascunho IA salvo. Revise antes de usar em estudos.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro na Etapa 2",
        description: e instanceof Error ? e.message : "Falha ao gerar complemento.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleExportComplementPdf = async () => {
    if (!complement || !loadedWave) return;
    setExportingPdf(true);
    try {
      const session = await createMmBrandedPdfSession(
        brandingUrlsFromLocal(brandingData),
      );
      const { doc, margins } = session;
      const pageW = doc.internal.pageSize.getWidth();
      let y = session.startY;
      const contentW = pageW - margins.left - margins.right;
      const onPage = () => drawWatermarkOnPage(doc, session.branding);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Complementação técnica (rascunho IA)", pageW / 2, y, {
        align: "center",
      });
      y += 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const resumo = doc.splitTextToSize(complement.resumoExecutivo, contentW);
      doc.text(resumo, margins.left, y);
      y += resumo.length * 5 + 6;

      for (const section of complement.sections) {
        if (y > 250) {
          doc.addPage();
          onPage();
          y = session.startY;
        }
        doc.setFont("helvetica", "bold");
        doc.text(section.title, margins.left, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(section.bodyMarkdown, contentW);
        doc.text(lines, margins.left, y);
        y += lines.length * 4.5 + 6;
      }

      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      const disc = doc.splitTextToSize(complement.disclaimer, contentW);
      doc.text(disc, margins.left, y);

      session.finalize();
      session.doc.save(
        `complemento-geoespacial-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportDocx = async () => {
    if (!complement || !loadedWave) return;
    setExportingDocx(true);
    try {
      const blob = await buildComplementDocxBlob(complement, {
        areaHa: loadedWave.perimeter.areaHa,
        generatedAtUtc: complement.generatedAtUtc,
      });
      downloadBlob(
        `complemento-geoespacial-${new Date().toISOString().slice(0, 10)}.docx`,
        blob,
      );
    } finally {
      setExportingDocx(false);
    }
  };

  return (
    <Card className="mb-6 border-primary/30">
      <CardHeader>
        <CardTitle>Etapa 2 — Complementação geoespacial (IA)</CardTitle>
        <CardDescription>
          Carrega uma análise factual Onda A e gera texto técnico para revisão (PDF e Word).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadingList ? (
          <p className="text-sm text-muted-foreground">Carregando análises...</p>
        ) : analyses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma análise factual salva. Gere primeiro o relatório factual acima.
          </p>
        ) : (
          <div className="space-y-2">
            <Label>Análise factual</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {analyses.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.factualSummary?.slice(0, 60) ?? a.id}…
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {loadingDoc ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : loadedWave ? (
          <p className="text-xs text-muted-foreground">
            Área             {loadedWave.perimeter.areaHa.toFixed(2)} ha ·{" "}
            {loadedWave.layers.filter((l) => l.status === "ok").length}/
            {loadedWave.layers.length} camadas OK
          </p>
        ) : null}

        <Button
          onClick={handleGenerateComplement}
          disabled={!loadedWave || generating}
          className="w-full sm:w-auto"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando complemento...
            </>
          ) : (
            "Gerar complemento com IA"
          )}
        </Button>

        {complement ? (
          <div className="space-y-3 rounded-md border p-3">
            <p className="text-sm font-medium">{complement.resumoExecutivo}</p>
            {complement.sections.map((s) => (
              <div key={s.key}>
                <p className="text-xs font-semibold">{s.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-4">
                  {s.bodyMarkdown}
                </p>
              </div>
            ))}
            <p className="text-[10px] italic text-muted-foreground">
              {complement.disclaimer}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportComplementPdf}
                disabled={exportingPdf}
              >
                {exportingPdf ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="mr-2 h-4 w-4" />
                )}
                PDF complemento
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportDocx}
                disabled={exportingDocx}
              >
                {exportingDocx ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                Word (.docx)
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
