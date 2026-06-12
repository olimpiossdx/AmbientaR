"use client";

import * as React from "react";
import { AlertTriangle, Download, FileText, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  generateFadReport,
  getFadReportDownloadUrl,
  listFadReports,
  listFadWorkspaces,
  type FadSmartReportDto,
} from "@/lib/fiscal-ambiental/fad-api-client";
import { FAD_REPORT_DISCLAIMER, REPORT_TYPE_LABELS } from "@/lib/fiscal-ambiental/report-labels";
import type { FadReportType, FadWorkspace } from "@/lib/fiscal-ambiental/types";
import { getFadAuthToken } from "@/lib/fiscal-ambiental/use-fad-auth-token";
import { useToast } from "@/hooks/use-toast";

const REPORT_TYPES: FadReportType[] = ["consolidado", "acervo", "mudancas", "fiscalizacao"];

export function FadRelatoriosClient() {
  const { toast } = useToast();
  const [workspaces, setWorkspaces] = React.useState<FadWorkspace[]>([]);
  const [workspaceId, setWorkspaceId] = React.useState("");
  const [reportType, setReportType] = React.useState<FadReportType>("consolidado");
  const [reports, setReports] = React.useState<FadSmartReportDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const token = await getFadAuthToken();
        const res = await listFadWorkspaces(token);
        if (res.ok && res.data.length) {
          setWorkspaces(res.data);
          setWorkspaceId(res.data[0]!.id);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadReports = React.useCallback(async (wsId: string) => {
    const token = await getFadAuthToken();
    const res = await listFadReports(token, wsId);
    if (res.ok) setReports(res.data);
  }, []);

  React.useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    loadReports(workspaceId).finally(() => setLoading(false));
  }, [workspaceId, loadReports]);

  const handleGenerate = async () => {
    if (!workspaceId) return;
    setGenerating(true);
    try {
      const token = await getFadAuthToken();
      const res = await generateFadReport(token, workspaceId, reportType);
      if (!res.ok) {
        toast({ variant: "destructive", title: "Erro", description: res.error });
        return;
      }
      await loadReports(workspaceId);
      toast({ title: "Relatório gerado", description: res.data.title });
      if (res.data.downloadUrl) {
        window.open(res.data.downloadUrl, "_blank", "noopener,noreferrer");
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (reportId: string) => {
    const token = await getFadAuthToken();
    const res = await getFadReportDownloadUrl(token, workspaceId, reportId);
    if (!res.ok) {
      toast({ variant: "destructive", title: "Erro", description: res.error });
      return;
    }
    window.open(res.data.downloadUrl, "_blank", "noopener,noreferrer");
  };

  if (loading && !workspaces.length) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        A carregar…
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Relatórios inteligentes</h1>
          <p className="text-sm text-muted-foreground">
            PDFs técnicos com acervo, análises, achados e ressalva padrão.
          </p>
        </div>
        <div className="space-y-1">
          <Label>Imóvel</Label>
          <Select value={workspaceId} onValueChange={setWorkspaceId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {workspaces.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Ressalva</AlertTitle>
        <AlertDescription>{FAD_REPORT_DISCLAIMER}</AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Gerar novo relatório</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select value={reportType} onValueChange={(v) => setReportType(v as FadReportType)}>
              <SelectTrigger className="w-[260px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {REPORT_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Gerar PDF
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-medium">Relatórios anteriores</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum relatório gerado ainda.</p>
        ) : (
          <ul className="space-y-2">
            {reports.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-4 py-3"
              >
                <div>
                  <p className="font-medium text-sm">{r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.createdAt.slice(0, 10)} · {r.status}
                  </p>
                </div>
                {r.status === "ready" ? (
                  <Button size="sm" variant="outline" onClick={() => handleDownload(r.id)}>
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
