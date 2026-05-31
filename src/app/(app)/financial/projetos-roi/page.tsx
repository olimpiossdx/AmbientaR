'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, useCollection, useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import type {
  Client,
  Contract,
  Empreendedor,
  Expense,
  Invoice,
  Project,
  ProjectRoiCase,
  Revenue,
} from '@/lib/types';
import { formatCurrencyBRL } from '@/lib/financial-core';
import { getFirestoreErrorMessage } from '@/lib/firestore-payload';
import { buildProjectRoiSnapshot } from '@/lib/project-roi-aggregator';
import {
  createManualRoiCase,
  syncFormalCasesFromContracts,
} from '@/lib/project-roi-case-service';
import {
  listContractsPendingSignature,
  runContractSignatureReminders,
} from '@/lib/project-roi-governance';
import { ProjectRoiSemaforoBadge } from '@/components/financial/project-roi-semaforo-badge';
import { useToast } from '@/hooks/use-toast';
import { useFinancialMenuDebug } from '@/lib/financial-menu-debug';
import {
  canReadProjectRoi,
  canWriteProjectRoi,
  isProjectRoiSalesReadOnly,
} from '@/lib/role-guards';
import {
  DEFAULT_PROJECT_ROI_SEMAFORO_THRESHOLDS,
  type ProjectRoiCompanySettings,
} from '@/lib/project-roi-thresholds';
import { Plus, RefreshCw, FileSignature, AlertTriangle } from 'lucide-react';

export default function ProjetosRoiListPage() {
  const { firestore, user } = useFirebase();
  const { user: authUser } = useAuth();
  const role = authUser?.role;
  const { toast } = useToast();
  const router = useRouter();
  useFinancialMenuDebug();

  const [search, setSearch] = React.useState('');
  const [syncing, setSyncing] = React.useState(false);
  const [manualOpen, setManualOpen] = React.useState(false);
  const [manualApelido, setManualApelido] = React.useState('');
  const [manualOrcamento, setManualOrcamento] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const syncOnce = React.useRef(false);

  const casesQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'project_roi_cases') : null),
    [firestore, user],
  );
  const contractsQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'contracts') : null),
    [firestore, user],
  );
  const revenuesQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'revenues') : null),
    [firestore, user],
  );
  const expensesQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'expenses') : null),
    [firestore, user],
  );
  const invoicesQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'invoices') : null),
    [firestore, user],
  );
  const projectsQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'projects') : null),
    [firestore, user],
  );
  const clientsQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'clients') : null),
    [firestore, user],
  );
  const roiSettingsRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'companySettings', 'projectRoi') : null),
    [firestore],
  );

  const { data: cases, isLoading: lc } = useCollection<ProjectRoiCase>(casesQ);
  const { data: contracts, isLoading: lct } = useCollection<Contract>(contractsQ);
  const { data: revenues } = useCollection<Revenue>(revenuesQ);
  const { data: expenses } = useCollection<Expense>(expensesQ);
  const { data: invoices } = useCollection<Invoice>(invoicesQ);
  const { data: projects } = useCollection<Project>(projectsQ);
  const { data: clients } = useCollection<Client>(clientsQ);
  const { data: roiSettings } = useDoc<ProjectRoiCompanySettings>(roiSettingsRef);

  const canWrite = canWriteProjectRoi(role);
  const salesReadOnly = isProjectRoiSalesReadOnly(role);

  const projectMap = React.useMemo(() => {
    const m = new Map<string, Project>();
    projects?.forEach((p) => m.set(p.id, p));
    return m;
  }, [projects]);

  const clientMap = React.useMemo(() => {
    const m = new Map<string, string>();
    clients?.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [clients]);

  const runSync = React.useCallback(async () => {
    if (!firestore || !contracts) return;
    setSyncing(true);
    try {
      const { created, updated } = await syncFormalCasesFromContracts(
        firestore,
        contracts,
        user?.uid,
      );
      const reminders = await runContractSignatureReminders(firestore, contracts);
      toast({
        title: 'Sincronização concluída',
        description: `${created} caso(s) criado(s), ${updated} atualizado(s).${reminders > 0 ? ` ${reminders} lembrete(s) de assinatura enviado(s).` : ''}`,
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Erro na sincronização',
        description: 'Verifique permissões Firestore (project_roi_cases).',
      });
    } finally {
      setSyncing(false);
    }
  }, [firestore, contracts, user?.uid, toast]);

  React.useEffect(() => {
    if (!firestore || !contracts?.length || syncOnce.current) return;
    if (!canWrite) return;
    syncOnce.current = true;
    void runSync();
  }, [firestore, contracts, canWrite, runSync]);

  const pendingContracts = React.useMemo(
    () => (contracts ? listContractsPendingSignature(contracts) : []),
    [contracts],
  );

  const rows = React.useMemo(() => {
    if (!cases || !revenues || !expenses || !invoices) return [];
    const term = search.trim().toLowerCase();
    return cases
      .map((c) => {
        const snap = buildProjectRoiSnapshot(c, revenues, expenses, invoices, {
          clientNameById: clientMap,
          semaforoThresholds: roiSettings?.semaforo,
        });
        const project = c.projectId ? projectMap.get(c.projectId) : undefined;
        const title =
          c.apelido ||
          project?.propertyName ||
          c.empreendimentoTexto ||
          c.sourceProposalNumber ||
          c.id;
        return { case: c, snap, title, project };
      })
      .filter(({ case: c, title }) => {
        if (!term) return true;
        const ref = (c.sourceProposalNumber || '').toLowerCase();
        return (
          title.toLowerCase().includes(term) ||
          ref.includes(term) ||
          (c.empreendimentoTexto || '').toLowerCase().includes(term)
        );
      })
      .sort((a, b) => (a.case.updatedAt < b.case.updatedAt ? 1 : -1));
  }, [cases, revenues, expenses, invoices, search, clientMap, projectMap, roiSettings?.semaforo]);

  const activeRows = rows.filter(
    (r) =>
      r.case.statusGovernanca === 'ativo' ||
      r.case.statusGovernanca === 'informal',
  );
  const closedRows = rows.filter((r) => r.case.statusGovernanca === 'encerrado');

  async function handleCreateManual() {
    if (!firestore || !manualApelido.trim()) return;
    setCreating(true);
    try {
      const id = await createManualRoiCase(
        firestore,
        {
          apelido: manualApelido,
          orcamentoValor: manualOrcamento.trim()
            ? Number(manualOrcamento.replace(',', '.'))
            : undefined,
        },
        user?.uid,
      );
      setManualOpen(false);
      setManualApelido('');
      setManualOrcamento('');
      router.push(`/financial/projetos-roi/${id}`);
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Erro ao criar caso',
        description: getFirestoreErrorMessage(e),
      });
    } finally {
      setCreating(false);
    }
  }

  if (!canReadProjectRoi(role)) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">
          Acesso restrito aos perfis autorizados.
        </p>
      </div>
    );
  }

  const loading = lc || lct;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Projetos & ROI"
        description="Rentabilidade gerencial por contrato ou combinação — não substitui a DRE Contábil da empresa."
      >
        {canWrite && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void runSync()} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Sincronizar contratos
            </Button>
            <Button onClick={() => setManualOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo projeto (avaliação)
            </Button>
          </div>
        )}
      </PageHeader>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <Card className="border-amber-200/80 bg-amber-50/40 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Visão gerencial
            </CardTitle>
            <CardDescription>
              Impostos e receitas <strong>sem vínculo</strong> a um caso continuam apenas na{' '}
              <Link href="/financial/dre-contabil" className="underline">
                DRE Contábil
              </Link>
              . Aqui entram só lançamentos classificados neste projeto.
            </CardDescription>
          </CardHeader>
        </Card>

        {canWrite && <ProjectRoiThresholdsCard settings={roiSettings} />}

        <Tabs defaultValue="ativos">
          <TabsList>
            <TabsTrigger value="ativos">
              Casos ativos ({activeRows.length})
            </TabsTrigger>
            {canWrite && (
              <TabsTrigger value="pendencias">
                Pend. assinatura ({pendingContracts.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="encerrados">
              Encerrados ({closedRows.length})
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 flex max-w-md gap-2">
            <Input
              placeholder="Buscar apelido, proposta, empreendimento…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <TabsContent value="ativos" className="mt-4">
            <CasesTable rows={activeRows} loading={loading} salesReadOnly={salesReadOnly} />
          </TabsContent>

          {canWrite && (
            <TabsContent value="pendencias" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Aguardando PDF assinado</CardTitle>
                <CardDescription>
                  Contratos aprovados sem upload do assinado. Após{' '}
                  {7} dias, o sistema envia lembrete in-app ao financeiro (Q8).
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingContracts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma pendência.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Proposta / cliente</TableHead>
                        <TableHead>Empreendimento (texto)</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingContracts.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>
                            {c.sourceProposalNumber || '—'}
                            <br />
                            <span className="text-xs text-muted-foreground">
                              {c.contratante?.nome}
                            </span>
                          </TableCell>
                          <TableCell>{c.objeto?.empreendimento || '—'}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrencyBRL(c.pagamento?.valorTotal || 0)}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/contracts/${c.id}/edit`}>
                                <FileSignature className="h-3 w-3 mr-1" />
                                Contratos
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}

          <TabsContent value="encerrados" className="mt-4">
            <CasesTable rows={closedRows} loading={loading} salesReadOnly={salesReadOnly} />
          </TabsContent>
        </Tabs>
      </div>

      {canWrite && (
      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo projeto para avaliação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Apelido / nome de exibição</Label>
              <Input
                value={manualApelido}
                onChange={(e) => setManualApelido(e.target.value)}
                placeholder="Ex.: Piloto consultoria 2025"
              />
            </div>
            <div>
              <Label>Orçamento esperado (opcional)</Label>
              <Input
                value={manualOrcamento}
                onChange={(e) => setManualOrcamento(e.target.value)}
                placeholder="Ex.: 15000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => void handleCreateManual()}
              disabled={creating || !manualApelido.trim()}
            >
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}

function ProjectRoiThresholdsCard({
  settings,
}: {
  settings?: ProjectRoiCompanySettings | null;
}) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const t = settings?.semaforo ?? {};
  const [margemVerde, setMargemVerde] = React.useState(
    String(t.margemVerdeMinPct ?? DEFAULT_PROJECT_ROI_SEMAFORO_THRESHOLDS.margemVerdeMinPct),
  );
  const [open, setOpen] = React.useState(false);

  async function save() {
    if (!firestore) return;
    try {
      await setDoc(
        doc(firestore, 'companySettings', 'projectRoi'),
        {
          semaforo: {
            margemVerdeMinPct: Number(margemVerde) || 15,
          },
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      toast({ title: 'Limiares do semáforo salvos' });
      setOpen(false);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Erro ao salvar' });
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Limiares do semáforo</CardTitle>
          <CardDescription>
            Margem mínima para &quot;Ganhando&quot; (padrão 15%). Demais regras usam valores
            padrão do spec.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
          {open ? 'Fechar' : 'Editar'}
        </Button>
      </CardHeader>
      {open && (
        <CardContent className="flex flex-wrap gap-3 items-end">
          <div>
            <Label>Margem verde mín. (%)</Label>
            <Input
              type="number"
              className="w-28"
              value={margemVerde}
              onChange={(e) => setMargemVerde(e.target.value)}
            />
          </div>
          <Button onClick={() => void save()}>Salvar</Button>
        </CardContent>
      )}
    </Card>
  );
}

function CasesTable({
  rows,
  loading,
  salesReadOnly,
}: {
  rows: {
    case: ProjectRoiCase;
    snap: ReturnType<typeof buildProjectRoiSnapshot>;
    title: string;
  }[];
  loading: boolean;
  salesReadOnly?: boolean;
}) {
  if (loading) {
    return <Skeleton className="h-48 w-full" />;
  }
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Nenhum caso. Sincronize contratos assinados ou crie uma avaliação manual.
      </p>
    );
  }
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Projeto</TableHead>
              <TableHead>Ref.</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Orçamento</TableHead>
              <TableHead className="text-right">Recebido</TableHead>
              {!salesReadOnly && (
                <>
                  <TableHead className="text-right">Pago</TableHead>
                  <TableHead className="text-right">Saldo caixa</TableHead>
                  <TableHead className="text-right">Resultado</TableHead>
                </>
              )}
              {salesReadOnly && (
                <TableHead className="text-right">Margem %</TableHead>
              )}
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ case: c, snap, title }) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {title}
                  {c.origin === 'manual' && (
                    <span className="ml-1 text-xs text-muted-foreground">(informal)</span>
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {c.sourceProposalNumber || '—'}
                </TableCell>
                <TableCell>
                  <ProjectRoiSemaforoBadge semaforo={snap.semaforo} />
                </TableCell>
                <TableCell className="text-right">
                  {snap.orcamento > 0 ? formatCurrencyBRL(snap.orcamento) : '—'}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrencyBRL(snap.recebido)}
                </TableCell>
                {!salesReadOnly && (
                  <>
                    <TableCell className="text-right">
                      {formatCurrencyBRL(snap.pago)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyBRL(snap.saldoCaixa)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyBRL(snap.resultado)}
                    </TableCell>
                  </>
                )}
                {salesReadOnly && (
                  <TableCell className="text-right">
                    {snap.margemPct != null ? `${snap.margemPct.toFixed(0)}%` : '—'}
                  </TableCell>
                )}
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/financial/projetos-roi/${c.id}`}>Abrir</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
