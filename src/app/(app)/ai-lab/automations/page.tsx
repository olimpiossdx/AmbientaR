"use client";

import * as React from "react";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { GeoAnalysisComplementPanel } from "@/components/geospatial/geo-analysis-complement-panel";
import { useFirebase } from "@/firebase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useAuth } from "@/firebase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useLocalBranding } from "@/hooks/use-local-branding";
import {
  brandingUrlsFromLocal,
  createMmBrandedPdfSession,
  drawWatermarkOnPage,
} from "@/lib/pdf-branding-layout";
import { getAdminApiRequestHeaders } from "@/lib/admin-api-client";
import { AiProviderBadge } from "@/components/ai/ai-provider-badge";
import type { AiProviderId } from "@/lib/ai-provider-labels";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

type RagSource = {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  active?: boolean;
};

type AiLabReport = {
  id: string;
  title: string;
  objective: string;
  report: string;
  references: string[];
  createdAt?: unknown;
  createdByUid?: string;
  usedInternalSourceIds?: string[];
  usedExternalUrls?: string[];
  estimatedCostBRL?: number;
};

type CostControl = {
  monthlyBudgetBRL: number;
  hardStopEnabled: boolean;
};

const LOCAL_SOURCES_KEY = "ai_lab_sources_local_v1";
const LOCAL_REPORTS_KEY = "ai_lab_reports_local_v1";
const LOCAL_COST_CONTROL_KEY = "ai_lab_cost_control_local_v1";
const DEFAULT_MONTHLY_BUDGET_BRL = 200;
const ESTIMATED_BRL_PER_1K_CHARS = 0.03;

function readLocal<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal<T>(key: string, data: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(data));
}

function isPermissionDenied(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code =
    "code" in error ? String((error as { code?: unknown }).code) : "";
  return code.includes("permission-denied");
}

function getDateFromUnknown(value: unknown): Date | null {
  if (!value) return null;
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    const d = (value as { toDate: () => Date }).toDate();
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
  }
  return null;
}

function isInCurrentMonth(value: unknown) {
  const d = getDateFromUnknown(value);
  if (!d) return false;
  const now = new Date();
  return (
    d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  );
}

function estimateRequestCostBRL(params: {
  reportTitle: string;
  objective: string;
  instructions: string;
  selectedSources: RagSource[];
  usedExternalUrls: string[];
}) {
  const inputChars =
    params.reportTitle.length +
    params.objective.length +
    params.instructions.length +
    params.selectedSources.reduce(
      (acc, item) => acc + (item.content?.length || 0),
      0,
    ) +
    params.usedExternalUrls.reduce((acc, item) => acc + item.length, 0);
  const estimated = (inputChars / 1000) * ESTIMATED_BRL_PER_1K_CHARS;
  return Number(Math.max(0.01, estimated).toFixed(4));
}

export default function AiLabAutomationsPage() {
  const { data: brandingData } = useLocalBranding();
  const { user } = useAuth();
  const { firestore, auth } = useFirebase();
  const { toast } = useToast();
  const [reportTitle, setReportTitle] = React.useState("");
  const [objective, setObjective] = React.useState("");
  const [instructions, setInstructions] = React.useState("");
  const [externalUrls, setExternalUrls] = React.useState("");
  const [selectedSourceIds, setSelectedSourceIds] = React.useState<string[]>(
    [],
  );
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [reportResult, setReportResult] = React.useState<string>("");
  const [lastReportProvider, setLastReportProvider] =
    React.useState<AiProviderId | null>(null);
  const [references, setReferences] = React.useState<string[]>([]);
  const [externalErrors, setExternalErrors] = React.useState<string[]>([]);
  const [lastReportTitle, setLastReportTitle] = React.useState<string>("");
  const [sources, setSources] = React.useState<RagSource[]>([]);
  const [reportsHistory, setReportsHistory] = React.useState<AiLabReport[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(true);
  const [costControl, setCostControl] = React.useState<CostControl>({
    monthlyBudgetBRL: DEFAULT_MONTHLY_BUDGET_BRL,
    hardStopEnabled: true,
  });
  const [isSavingCostControl, setIsSavingCostControl] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      if (!firestore) {
        setSources(
          readLocal<RagSource>(LOCAL_SOURCES_KEY).filter(
            (s) => s.active !== false,
          ),
        );
        setReportsHistory(readLocal<AiLabReport>(LOCAL_REPORTS_KEY));
        setIsLoadingHistory(false);
        return;
      }

      try {
        const [sourcesSnap, reportsSnap] = await Promise.all([
          getDocs(
            query(
              collection(firestore, "ai_lab_sources"),
              where("active", "==", true),
            ),
          ),
          getDocs(
            query(
              collection(firestore, "ai_lab_reports"),
              orderBy("createdAt", "desc"),
            ),
          ),
        ]);

        const cloudSources = sourcesSnap.docs.map((doc) => {
          const data = doc.data() as Omit<RagSource, "id">;
          return { id: doc.id, ...data };
        });
        const cloudReports = reportsSnap.docs.map((doc) => {
          const data = doc.data() as Omit<AiLabReport, "id">;
          return { id: doc.id, ...data };
        });

        setSources(cloudSources);
        setReportsHistory(cloudReports);

        try {
          const cfgRef = doc(firestore, "ai_lab_cost_controls", "monthly");
          const cfgSnap = await getDoc(cfgRef);
          if (cfgSnap.exists()) {
            const cfg = cfgSnap.data() as Partial<CostControl>;
            setCostControl({
              monthlyBudgetBRL:
                typeof cfg.monthlyBudgetBRL === "number" &&
                cfg.monthlyBudgetBRL > 0
                  ? cfg.monthlyBudgetBRL
                  : DEFAULT_MONTHLY_BUDGET_BRL,
              hardStopEnabled: cfg.hardStopEnabled !== false,
            });
          }
        } catch (error) {
          if (!isPermissionDenied(error)) {
            console.error("Erro ao carregar controle de custo:", error);
          }
        }
      } catch (error) {
        if (!isPermissionDenied(error)) {
          console.error(
            "Erro ao carregar dados do Hub IA no Firestore:",
            error,
          );
        }
        setSources(
          readLocal<RagSource>(LOCAL_SOURCES_KEY).filter(
            (s) => s.active !== false,
          ),
        );
        setReportsHistory(readLocal<AiLabReport>(LOCAL_REPORTS_KEY));
        const localCfg = readLocal<CostControl>(LOCAL_COST_CONTROL_KEY)[0];
        if (localCfg) setCostControl(localCfg);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    void load();
  }, [firestore]);

  const selectedSources = React.useMemo(
    () => (sources || []).filter((s) => selectedSourceIds.includes(s.id)),
    [sources, selectedSourceIds],
  );

  const monthlySpentBRL = React.useMemo(
    () =>
      (reportsHistory || [])
        .filter((item) => isInCurrentMonth(item.createdAt))
        .reduce(
          (acc, item) =>
            acc +
            (typeof item.estimatedCostBRL === "number"
              ? item.estimatedCostBRL
              : 0),
          0,
        ),
    [reportsHistory],
  );

  const monthlyBudgetBRL = Math.max(
    1,
    Number(costControl.monthlyBudgetBRL || DEFAULT_MONTHLY_BUDGET_BRL),
  );
  const projectedRequestCostBRL = React.useMemo(
    () =>
      estimateRequestCostBRL({
        reportTitle: reportTitle.trim(),
        objective: objective.trim(),
        instructions: instructions.trim(),
        selectedSources,
        usedExternalUrls: externalUrls
          .split("\n")
          .map((u) => u.trim())
          .filter(Boolean),
      }),
    [reportTitle, objective, instructions, selectedSources, externalUrls],
  );

  const willExceedBudget =
    monthlySpentBRL + projectedRequestCostBRL > monthlyBudgetBRL;

  if (user && user.role !== "admin") {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Automações IA" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Acesso restrito</CardTitle>
              <CardDescription>
                Este módulo está disponível apenas para administradores nesta
                fase.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  const toggleSource = (id: string) => {
    setSelectedSourceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleGenerate = async () => {
    if (!reportTitle.trim() || !objective.trim()) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Informe título e objetivo do relatório.",
      });
      return;
    }

    if (selectedSources.length === 0 && !externalUrls.trim()) {
      toast({
        variant: "destructive",
        title: "Sem fontes",
        description: "Selecione fontes internas e/ou informe URLs externas.",
      });
      return;
    }

    if (costControl.hardStopEnabled && willExceedBudget) {
      toast({
        variant: "destructive",
        title: "Limite mensal atingido",
        description: `Projeção acima do teto mensal de R$ ${monthlyBudgetBRL.toFixed(2)}. Ajuste fontes/URLs ou aumente o teto.`,
      });
      return;
    }

    setIsGenerating(true);
    setReportResult("");
    setLastReportProvider(null);
    setReferences([]);
    setExternalErrors([]);

    try {
      const res = await fetch("/api/ai-lab/generate-report", {
        method: "POST",
        headers: await getAdminApiRequestHeaders(auth),
        body: JSON.stringify({
          reportTitle: reportTitle.trim(),
          objective: objective.trim(),
          additionalInstructions: instructions.trim(),
          internalSources: selectedSources.map((s) => ({
            id: s.id,
            title: s.title,
            content: s.content,
          })),
          externalUrls: externalUrls
            .split("\n")
            .map((u) => u.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Falha ao gerar relatório.");
      }

      const generatedReport = data.report || "";
      const generatedReferences = Array.isArray(data.references)
        ? data.references
        : [];
      const estimatedCostBRL =
        typeof data.estimatedCostBRL === "number"
          ? data.estimatedCostBRL
          : projectedRequestCostBRL;
      const usedExternalUrls = externalUrls
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean);

      setReportResult(generatedReport);
      setLastReportProvider(
        data.aiProvider === "gemini" || data.aiProvider === "deepseek"
          ? data.aiProvider
          : "deepseek",
      );
      setReferences(generatedReferences);
      setExternalErrors(
        Array.isArray(data.externalErrors) ? data.externalErrors : [],
      );
      setLastReportTitle(reportTitle.trim());

      if (firestore) {
        try {
          await addDoc(collection(firestore, "ai_lab_reports"), {
            title: reportTitle.trim(),
            objective: objective.trim(),
            report: generatedReport,
            references: generatedReferences,
            createdAt: serverTimestamp(),
            createdByUid: user?.uid || user?.id || undefined,
            usedInternalSourceIds: selectedSources.map((s) => s.id),
            usedExternalUrls,
            estimatedCostBRL,
          });

          const reportsSnap = await getDocs(
            query(
              collection(firestore, "ai_lab_reports"),
              orderBy("createdAt", "desc"),
            ),
          );
          const cloudReports = reportsSnap.docs.map((doc) => {
            const data = doc.data() as Omit<AiLabReport, "id">;
            return { id: doc.id, ...data };
          });
          setReportsHistory(cloudReports);
        } catch (error) {
          if (!isPermissionDenied(error)) throw error;
          const historyItem: AiLabReport = {
            id: `rep_${Date.now()}`,
            title: reportTitle.trim(),
            objective: objective.trim(),
            report: generatedReport,
            references: generatedReferences,
            createdAt: new Date().toISOString(),
            createdByUid: user?.uid || user?.id || undefined,
            usedInternalSourceIds: selectedSources.map((s) => s.id),
            usedExternalUrls,
            estimatedCostBRL,
          };
          const mergedHistory = [historyItem, ...reportsHistory];
          setReportsHistory(mergedHistory);
          writeLocal(LOCAL_REPORTS_KEY, mergedHistory);
        }
      } else {
        const historyItem: AiLabReport = {
          id: `rep_${Date.now()}`,
          title: reportTitle.trim(),
          objective: objective.trim(),
          report: generatedReport,
          references: generatedReferences,
          createdAt: new Date().toISOString(),
          createdByUid: user?.uid || user?.id || undefined,
          usedInternalSourceIds: selectedSources.map((s) => s.id),
          usedExternalUrls,
          estimatedCostBRL,
        };
        const mergedHistory = [historyItem, ...reportsHistory];
        setReportsHistory(mergedHistory);
        writeLocal(LOCAL_REPORTS_KEY, mergedHistory);
      }

      toast({
        title: "Relatório gerado",
        description: "Relatório e referências ABNT disponíveis abaixo.",
      });
    } catch (error) {
      console.error("Erro ao gerar relatório IA+RAG:", error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar relatório",
        description:
          error instanceof Error ? error.message : "Falha inesperada.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveCostControl = async () => {
    const payload: CostControl = {
      monthlyBudgetBRL: Math.max(
        1,
        Number(costControl.monthlyBudgetBRL || DEFAULT_MONTHLY_BUDGET_BRL),
      ),
      hardStopEnabled: !!costControl.hardStopEnabled,
    };
    setIsSavingCostControl(true);
    try {
      if (firestore) {
        await setDoc(
          doc(firestore, "ai_lab_cost_controls", "monthly"),
          { ...payload, updatedAt: serverTimestamp() },
          { merge: true },
        );
      } else {
        writeLocal(LOCAL_COST_CONTROL_KEY, [payload]);
      }
      setCostControl(payload);
      toast({
        title: "Controle de custo salvo",
        description: "Orçamento mensal e bloqueio automático atualizados.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Falha ao salvar",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar o controle de custo.",
      });
    } finally {
      setIsSavingCostControl(false);
    }
  };

  const handleExportPdf = async (title: string, report: string, refs: string[]) => {
    const session = await createMmBrandedPdfSession(
      brandingUrlsFromLocal(brandingData),
    );
    const { doc, margins } = session;
    const pageW = doc.internal.pageSize.getWidth();
    const maxY = 280;
    let y = session.startY;
    const onPdfPage = () => drawWatermarkOnPage(doc, session.branding);
    const contentW = pageW - margins.left - margins.right;

    const writeTitle = (text: string) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      const lines = doc.splitTextToSize(text, contentW);
      lines.forEach((line: string) => {
        if (y > maxY) {
          doc.addPage();
          onPdfPage();
          y = session.startY;
        }
        doc.text(line, margins.left, y);
        y += 7;
      });
      y += 2;
    };

    const writeParagraph = (text: string, size = 10) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(text, contentW);
      lines.forEach((line: string) => {
        if (y > maxY) {
          doc.addPage();
          onPdfPage();
          y = session.startY;
        }
        doc.text(line, margins.left, y);
        y += 5;
      });
      y += 2;
    };

    writeTitle(title || "Relatório IA + RAG");
    writeParagraph(report || "Relatório sem conteúdo.");

    if (refs.length > 0) {
      if (y > maxY - 20) {
        doc.addPage();
        onPdfPage();
        y = session.startY;
      }
      writeTitle("Referências (ABNT)");
      refs.forEach((r, idx) => writeParagraph(`${idx + 1}. ${r}`, 9));
    }

    session.finalize();
    doc.save(`relatorio-ia-rag-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Automações IA" />
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
        {user?.uid ? (
          <Suspense fallback={null}>
            <GeoAnalysisComplementPanel userId={user.uid} />
          </Suspense>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle>Objetivo do módulo</CardTitle>
            <CardDescription>
              Planejar e priorizar automações com IA por ganho real de operação.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              - Backlog inicial: alertas inteligentes, resumo documental e
              priorização de pendências.
            </p>
            <p>
              - Critérios: impacto, risco, custo por token e esforço de
              manutenção.
            </p>
            <p>
              - Rollout: piloto no hub, validação e posterior distribuição nos
              menus de negócio.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orçamento mensal de IA</CardTitle>
            <CardDescription>
              Painel de custo estimado mensal com bloqueio automático por teto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-md border p-3">
                <p className="text-muted-foreground">Gasto estimado no mês</p>
                <p className="font-semibold">R$ {monthlySpentBRL.toFixed(2)}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-muted-foreground">Teto mensal</p>
                <p className="font-semibold">
                  R$ {monthlyBudgetBRL.toFixed(2)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-muted-foreground">
                  Próxima geração (estimativa)
                </p>
                <p className="font-semibold">
                  R$ {projectedRequestCostBRL.toFixed(4)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
              <div className="space-y-1">
                <Label>Teto mensal (R$)</Label>
                <Input
                  type="number"
                  min={1}
                  step="1"
                  value={String(costControl.monthlyBudgetBRL)}
                  onChange={(e) =>
                    setCostControl((prev) => ({
                      ...prev,
                      monthlyBudgetBRL: Number(
                        e.target.value || DEFAULT_MONTHLY_BUDGET_BRL,
                      ),
                    }))
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={costControl.hardStopEnabled}
                  onCheckedChange={(v) =>
                    setCostControl((prev) => ({
                      ...prev,
                      hardStopEnabled: !!v,
                    }))
                  }
                />
                Ativar bloqueio automático ao atingir teto
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveCostControl}
                disabled={isSavingCostControl}
              >
                {isSavingCostControl ? "Salvando..." : "Salvar orçamento"}
              </Button>
              {willExceedBudget && costControl.hardStopEnabled && (
                <span className="text-xs text-destructive">
                  A próxima geração será bloqueada por exceder o teto mensal.
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gerador de relatório (interno + externo)</CardTitle>
            <CardDescription>
              Gera relatório com base em fontes internas (RAG) e, opcionalmente,
              pesquisa externa por URL com citações ABNT.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-300">
              Guardrails de custo ativos: máximo de 8 fontes internas, 3 URLs
              externas e limite de tamanho por requisição.
            </div>
            <div className="space-y-1">
              <Label>Título do relatório</Label>
              <Input
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Ex.: Estudo técnico preliminar de conformidade ambiental"
              />
            </div>
            <div className="space-y-1">
              <Label>Objetivo</Label>
              <Textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Descreva claramente o objetivo do estudo."
                className="min-h-20"
              />
            </div>
            <div className="space-y-1">
              <Label>Instruções adicionais (opcional)</Label>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Ex.: destacar riscos regulatórios para MG e recomendações práticas."
                className="min-h-20"
              />
            </div>
            <div className="space-y-2">
              <Label>Fontes internas (RAG)</Label>
              <div className="space-y-2 rounded-md border p-3 max-h-56 overflow-auto">
                {(sources || []).length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma fonte interna ativa encontrada.
                  </p>
                )}
                {(sources || []).map((source) => (
                  <label
                    key={source.id}
                    className="flex items-start gap-2 text-sm"
                  >
                    <Checkbox
                      checked={selectedSourceIds.includes(source.id)}
                      onCheckedChange={() => toggleSource(source.id)}
                    />
                    <span>
                      <span className="font-medium">{source.title}</span>
                      <span className="block text-xs text-muted-foreground line-clamp-2">
                        {source.content}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label>URLs externas para pesquisa (1 por linha, opcional)</Label>
              <Textarea
                value={externalUrls}
                onChange={(e) => setExternalUrls(e.target.value)}
                placeholder={
                  "https://www.gov.br/...\\nhttps://www.ibama.gov.br/..."
                }
                className="min-h-24"
              />
            </div>
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating
                ? "Gerando relatório..."
                : "Gerar relatório ABNT (DeepSeek)"}
            </Button>
          </CardContent>
        </Card>

        {(reportResult ||
          references.length > 0 ||
          externalErrors.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Resultado</CardTitle>
              <CardDescription>
                Saída gerada com trilha de fontes para uso técnico.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {lastReportProvider ? (
                <AiProviderBadge provider={lastReportProvider} showHint />
              ) : null}
              {reportResult && (
                <div>
                  <Label>Relatório</Label>
                  <pre className="mt-2 whitespace-pre-wrap text-sm bg-muted rounded-md p-3">
                    {reportResult}
                  </pre>
                </div>
              )}
              {references.length > 0 && (
                <div>
                  <Label>Referências (ABNT)</Label>
                  <ul className="mt-2 list-disc pl-5 text-sm space-y-1">
                    {references.map((ref, idx) => (
                      <li key={`${idx}-${ref.slice(0, 20)}`}>{ref}</li>
                    ))}
                  </ul>
                </div>
              )}
              {externalErrors.length > 0 && (
                <div>
                  <Label className="text-destructive">
                    Avisos de fontes externas
                  </Label>
                  <ul className="mt-2 list-disc pl-5 text-sm text-destructive space-y-1">
                    {externalErrors.map((err, idx) => (
                      <li key={`${idx}-${err.slice(0, 20)}`}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  handleExportPdf(
                    lastReportTitle || reportTitle || "Relatório IA + RAG",
                    reportResult,
                    references,
                  )
                }
                disabled={!reportResult}
              >
                Exportar PDF com referências ABNT
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Histórico de relatórios</CardTitle>
            <CardDescription>
              Relatórios gerados no hub para auditoria e reaproveitamento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoadingHistory && (
              <p className="text-sm text-muted-foreground">
                Carregando histórico...
              </p>
            )}
            {!isLoadingHistory &&
              (!reportsHistory || reportsHistory.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  Nenhum relatório salvo ainda.
                </p>
              )}
            {!isLoadingHistory &&
              reportsHistory?.slice(0, 20).map((item) => (
                <div key={item.id} className="rounded-md border p-3">
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {item.objective}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setLastReportTitle(item.title);
                        setReportResult(item.report);
                        setReferences(item.references || []);
                        setExternalErrors([]);
                      }}
                    >
                      Reabrir
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleExportPdf(
                          item.title,
                          item.report,
                          item.references || [],
                        )
                      }
                    >
                      PDF
                    </Button>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
