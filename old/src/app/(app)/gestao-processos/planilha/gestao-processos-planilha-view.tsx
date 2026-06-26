"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import {
  collection,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import {
  GESTAO_PROCESSOS_MENU_LABEL,
  GESTAO_PROCESSOS_FLUXO_PATH,
} from "@/lib/gestao-processos-menu";
import { canWriteGestaoProcessos } from "@/lib/gestao-processos/role-guards";
import type {
  ConsultoriaProject,
  OfficeProcess,
  OfficeProcessImportPreview,
} from "@/lib/gestao-processos/types";
import {
  downloadOfficeProcessExport,
  parseOfficeProcessWorkbook,
} from "@/lib/gestao-processos/excel";
import { commitOfficeProcessImport } from "@/lib/gestao-processos/office-process-import";
import { buildOfficeProcessExternalKey } from "@/lib/gestao-processos/utils";
import { ExcelImportDialog } from "@/components/gestao-processos/excel-import-dialog";
import type { Empreendedor } from "@/lib/types";
import * as XLSX from "@e965/xlsx";
import {
  ArrowLeft,
  Download,
  FileDown,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";

export function GestaoProcessosPlanilhaView() {
  const router = useRouter();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const canWrite = canWriteGestaoProcessos(user?.role);

  const [importOpen, setImportOpen] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [loadingSeed, setLoadingSeed] = React.useState(false);
  const [purgeOpen, setPurgeOpen] = React.useState(false);
  const [purging, setPurging] = React.useState(false);

  const processesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "officeProcesses") : null),
    [firestore],
  );
  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "empreendedores") : null),
    [firestore],
  );
  const consultoriaProjectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "consultoriaProjects") : null),
    [firestore],
  );

  const { data: processes } = useCollection<OfficeProcess>(processesQuery);
  const { data: empreendedores } = useCollection<Empreendedor>(empreendedoresQuery);
  const { data: consultoriaProjects } =
    useCollection<ConsultoriaProject>(consultoriaProjectsQuery);

  React.useEffect(() => {
    if (user && !canWrite) {
      router.replace(GESTAO_PROCESSOS_FLUXO_PATH);
    }
  }, [user, canWrite, router]);

  const existingByKey = React.useMemo(() => {
    const map = new Map<string, OfficeProcess>();
    for (const p of processes ?? []) {
      if (p.externalKey) map.set(p.externalKey, p);
      else {
        map.set(
          buildOfficeProcessExternalKey(p.tipoProcesso, p.numeroProcesso),
          p,
        );
      }
    }
    return map;
  }, [processes]);

  const seedCount = React.useMemo(
    () => (processes ?? []).filter((p) => p.seedValidation).length,
    [processes],
  );

  const runImport = async (
    preview: OfficeProcessImportPreview,
    options: { seedValidation: boolean },
  ) => {
    if (!firestore) return;
    setImporting(true);
    try {
      const result = await commitOfficeProcessImport(firestore, preview, {
        seedValidation: options.seedValidation,
        empreendedores: empreendedores ?? undefined,
        consultoriaProjects: consultoriaProjects ?? undefined,
        existingByKey,
      });
      toast({
        title: "Importação concluída",
        description: `${result.created} criado(s), ${result.updated} atualizado(s), ${result.linked} vinculado(s).`,
      });
      setImportOpen(false);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro na importação",
        description: (e as Error).message,
      });
    } finally {
      setImporting(false);
    }
  };

  const importValidationSeed = async () => {
    setLoadingSeed(true);
    try {
      const res = await fetch("/seeds/processos-validacao.xlsx");
      if (!res.ok) throw new Error("Planilha de validação não encontrada.");
      const buffer = await res.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
      const preview = parseOfficeProcessWorkbook(workbook);
      await runImport(preview, { seedValidation: true });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar validação",
        description: (e as Error).message,
      });
    } finally {
      setLoadingSeed(false);
    }
  };

  const purgeSeedData = async () => {
    if (!firestore) return;
    setPurging(true);
    try {
      const snap = await getDocs(collection(firestore, "officeProcesses"));
      const targets = snap.docs.filter((d) => d.data().seedValidation === true);
      if (!targets.length) {
        toast({ title: "Nenhum dado de validação para remover." });
        setPurgeOpen(false);
        return;
      }
      const batch = writeBatch(firestore);
      targets.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      toast({
        title: "Dados de validação removidos",
        description: `${targets.length} processo(s) apagado(s).`,
      });
      setPurgeOpen(false);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao apagar",
        description: (e as Error).message,
      });
    } finally {
      setPurging(false);
    }
  };

  if (!canWrite) return null;

  return (
    <>
      <PageHeader
        title="Geral"
        description={`${GESTAO_PROCESSOS_MENU_LABEL} — acompanhamento e ferramentas operacionais.`}
      >
        <Button variant="outline" size="sm" asChild>
          <Link href={GESTAO_PROCESSOS_FLUXO_PATH}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 p-4 md:grid-cols-2 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acompanhamento manual</CardTitle>
            <CardDescription>
              Lance processos e atualize status diretamente no painel de acompanhamento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href={GESTAO_PROCESSOS_FLUXO_PATH}>
                Abrir acompanhamento
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ferramenta de importação</CardTitle>
            <CardDescription>
              Carregue a planilha com a aba PROCESSO. Processos existentes (mesmo
              SEI/SLA) são atualizados.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Importar Excel (.xlsx)
            </Button>
            <Button
              variant="secondary"
              disabled={loadingSeed || importing}
              onClick={() => void importValidationSeed()}
            >
              {loadingSeed ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Importar planilha de validação (fictícia)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ferramenta de exportação</CardTitle>
            <CardDescription>
              Baixe todos os processos atuais para editar no Excel e reimportar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() =>
                downloadOfficeProcessExport(
                  processes ?? [],
                  "gestao-processos-export.xlsx",
                  consultoriaProjects ?? undefined,
                )
              }
            >
              <FileDown className="mr-2 h-4 w-4" />
              Exportar {processes?.length ?? 0} processo(s)
            </Button>
          </CardContent>
        </Card>

        {seedCount > 0 ? (
          <Card className="border-dashed md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Dados de validação</CardTitle>
              <CardDescription>
                {seedCount} processo(s) marcados como fictícios para teste. Apague
                quando terminar a validação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={() => setPurgeOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Apagar todos os dados de validação
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <ExcelImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        importing={importing}
        onConfirm={runImport}
      />

      <AlertDialog open={purgeOpen} onOpenChange={setPurgeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar dados de validação?</AlertDialogTitle>
            <AlertDialogDescription>
              Serão removidos {seedCount} processo(s) marcados como fictícios. Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={purging}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={purging}
              onClick={(e) => {
                e.preventDefault();
                void purgeSeedData();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {purging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
