'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { collection, doc, query, updateDoc, where } from 'firebase/firestore';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth, useCollection, useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import type {
  Client,
  Contract,
  Expense,
  Fornecedor,
  Invoice,
  ProjectRoiCase,
  ProjectRoiParcelaPrevista,
  ProjectRoiTimeEntry,
  Revenue,
  SupplierContract,
} from '@/lib/types';
import type { ProjectRoiCompanySettings } from '@/lib/project-roi-thresholds';
import { formatCurrencyBRL } from '@/lib/financial-core';
import {
  buildProjectRoiSnapshot,
  extratoLineTipoLabel,
  extratoValorVariant,
  isAbatimentoExtratoLine,
  type ProjectRoiExtratoLine,
} from '@/lib/project-roi-aggregator';
import { buildSupplierPaymentSummary } from '@/lib/project-roi-supplier-summary';
import { expenseCategoryLabel } from '@/lib/project-roi-export';
import type { ProjectRoiExportInput } from '@/lib/project-roi-export';
import {
  encerrarRoiCase,
  deleteRoiCase,
  linkManualCaseToContract,
  reabrirRoiCase,
} from '@/lib/project-roi-case-service';
import {
  formatDreLineValue,
} from '@/lib/project-roi-dre-export';
import { ProjectRoiExportButtons } from '@/components/financial/project-roi-export-buttons';
import { DeleteRoiTransactionButton } from '@/components/financial/delete-roi-transaction-button';
import { EditRoiTransactionButton } from '@/components/financial/edit-roi-transaction-button';
import { ProjectRoiSemaforoBadge } from '@/components/financial/project-roi-semaforo-badge';
import { TransactionForm } from '@/app/(app)/cash-flow/transaction-form';
import { useToast } from '@/hooks/use-toast';
import { useFinancialMenuDebug } from '@/lib/financial-menu-debug';
import {
  canDeleteProjectRoi,
  canReadProjectRoi,
  canWriteProjectRoi,
  isProjectRoiSalesReadOnly,
} from '@/lib/role-guards';
import {
  addTimeEntry,
  deleteTimeEntry,
} from '@/lib/project-roi-time-entries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, ChevronDown, Paperclip, Plus, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getFirestoreErrorMessage } from '@/lib/firestore-payload';

export function ProjetosRoiDetailView() {
  const params = useParams();
  const caseId =
    params && typeof params.caseId === 'string' ? params.caseId : '';
  const { firestore, user } = useFirebase();
  const { user: authUser } = useAuth();
  const role = authUser?.role;
  const { toast } = useToast();
  const router = useRouter();
  useFinancialMenuDebug();

  const caseRef = useMemoFirebase(
    () => (firestore && caseId ? doc(firestore, 'project_roi_cases', caseId) : null),
    [firestore, caseId],
  );
  const { data: roiCase, isLoading: lc } = useDoc<ProjectRoiCase>(caseRef);
  const roiSettingsRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'companySettings', 'projectRoi') : null),
    [firestore],
  );
  const { data: roiSettings } = useDoc<ProjectRoiCompanySettings>(roiSettingsRef);

  const canWrite = canWriteProjectRoi(role);
  const canDelete = canDeleteProjectRoi(role);
  const salesReadOnly = isProjectRoiSalesReadOnly(role);

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

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
  const clientsQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'clients') : null),
    [firestore, user],
  );
  const suppliersQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'fornecedores') : null),
    [firestore, user],
  );

  const { data: revenues } = useCollection<Revenue>(revenuesQ);
  const { data: expenses } = useCollection<Expense>(expensesQ);
  const { data: invoices } = useCollection<Invoice>(invoicesQ);
  const { data: clients } = useCollection<Client>(clientsQ);
  const { data: suppliers } = useCollection<Fornecedor>(suppliersQ);

  const contractsQ = useMemoFirebase(
    () =>
      firestore && user
        ? query(
            collection(firestore, 'contracts'),
            where('status', '==', 'Aprovado'),
          )
        : null,
    [firestore, user],
  );
  const { data: contracts } = useCollection<Contract>(contractsQ);

  const supplierContractsQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'supplierContracts') : null),
    [firestore, user],
  );
  const { data: supplierContracts } = useCollection<SupplierContract>(
    supplierContractsQ,
  );

  const timeEntriesQ = useMemoFirebase(
    () =>
      firestore && caseId
        ? collection(firestore, 'project_roi_cases', caseId, 'time_entries')
        : null,
    [firestore, caseId],
  );
  const { data: timeEntriesRaw } = useCollection<ProjectRoiTimeEntry>(timeEntriesQ);

  const clientMap = React.useMemo(() => {
    const m = new Map<string, string>();
    clients?.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [clients]);

  const supplierMap = React.useMemo(() => {
    const m = new Map<string, string>();
    suppliers?.forEach((s) => m.set(s.id, s.name || s.id));
    return m;
  }, [suppliers]);

  const snap = React.useMemo(() => {
    if (!roiCase || !revenues || !expenses || !invoices) return null;
    return buildProjectRoiSnapshot(roiCase, revenues, expenses, invoices, {
      clientNameById: clientMap,
      supplierNameById: supplierMap,
      semaforoThresholds: roiSettings?.semaforo,
    });
  }, [roiCase, revenues, expenses, invoices, clientMap, supplierMap, roiSettings?.semaforo]);

  const linkedSupplierContracts = React.useMemo(() => {
    if (!supplierContracts || !roiCase) return [];
    return supplierContracts.filter(
      (sc) =>
        sc.projectRoiCaseId === roiCase.id ||
        (roiCase.contractId && sc.clientContractId === roiCase.contractId),
    );
  }, [supplierContracts, roiCase]);

  const supplierSummary = React.useMemo(() => {
    if (!roiCase || !expenses || !revenues) {
      return { totalPaid: 0, groups: [] };
    }
    return buildSupplierPaymentSummary(
      expenses,
      roiCase,
      supplierMap,
      revenues,
      linkedSupplierContracts,
    );
  }, [expenses, roiCase, supplierMap, revenues, linkedSupplierContracts]);

  const exportInput = React.useMemo((): ProjectRoiExportInput | null => {
    if (!roiCase || !snap) return null;
    return {
      roiCase,
      snap,
      title:
        roiCase.apelido ||
        roiCase.empreendimentoTexto ||
        roiCase.sourceProposalNumber ||
        roiCase.id,
      supplierSummary,
    };
  }, [roiCase, snap, supplierSummary]);

  const [extratoFilter, setExtratoFilter] = React.useState<
    'all' | 'saidas' | 'entradas'
  >('all');
  const [groupBySupplier, setGroupBySupplier] = React.useState(false);

  const [apelido, setApelido] = React.useState('');
  const [horasEstimadas, setHorasEstimadas] = React.useState('');
  const [aliquotaPct, setAliquotaPct] = React.useState('');
  const [impostoFixo, setImpostoFixo] = React.useState('');
  const [lancarTipo, setLancarTipo] = React.useState<'revenue' | 'expense'>('revenue');
  const [parcelas, setParcelas] = React.useState<ProjectRoiParcelaPrevista[]>(
    [],
  );
  const [horasRegistradasManual, setHorasRegistradasManual] = React.useState('');
  const [newEntryHours, setNewEntryHours] = React.useState('');
  const [newEntryDate, setNewEntryDate] = React.useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [newEntryActivity, setNewEntryActivity] = React.useState('');
  const [linkContractId, setLinkContractId] = React.useState('');
  const [linkingContract, setLinkingContract] = React.useState(false);

  React.useEffect(() => {
    if (!roiCase) return;
    setApelido(roiCase.apelido || '');
    setHorasEstimadas(
      roiCase.horasEstimadas != null ? String(roiCase.horasEstimadas) : '',
    );
    setAliquotaPct(
      roiCase.aliquotaImpostoPct != null ? String(roiCase.aliquotaImpostoPct) : '',
    );
    setImpostoFixo(
      roiCase.impostoEstimadoValor != null
        ? String(roiCase.impostoEstimadoValor)
        : '',
    );
    setParcelas(roiCase.parcelasPrevistas ?? []);
    setHorasRegistradasManual(
      roiCase.horasRegistradas != null ? String(roiCase.horasRegistradas) : '',
    );
  }, [roiCase]);

  const encerrado = roiCase?.statusGovernanca === 'encerrado';

  async function saveConfig() {
    if (!firestore || !roiCase) return;
    try {
      await updateDoc(doc(firestore, 'project_roi_cases', roiCase.id), {
        apelido: apelido.trim() || null,
        horasEstimadas: horasEstimadas ? Number(horasEstimadas) : null,
        aliquotaImpostoPct: aliquotaPct ? Number(aliquotaPct) : null,
        impostoEstimadoValor: impostoFixo ? Number(impostoFixo) : null,
        parcelasPrevistas: parcelas.length ? parcelas : null,
        horasRegistradas: horasRegistradasManual
          ? Number(horasRegistradasManual)
          : null,
        updatedAt: new Date().toISOString(),
        updatedByUid: user?.uid,
      });
      toast({ title: 'Configuração salva' });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Erro ao salvar' });
    }
  }

  async function handleLinkContract() {
    if (!firestore || !roiCase || !linkContractId) return;
    const contract = contracts?.find((c) => c.id === linkContractId);
    if (!contract?.fileUrl?.trim()) {
      toast({
        variant: 'destructive',
        title: 'Contrato sem arquivo assinado',
        description: 'O contrato precisa ter PDF/link de assinatura.',
      });
      return;
    }
    setLinkingContract(true);
    try {
      await linkManualCaseToContract(
        firestore,
        roiCase.id,
        contract,
        user?.uid,
      );
      toast({ title: 'Caso vinculado ao contrato formal' });
      router.refresh();
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Erro ao vincular',
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setLinkingContract(false);
    }
  }

  function addParcela() {
    setParcelas((prev) => [
      ...prev,
      {
        id: `p-${Date.now()}`,
        vencimento: new Date().toISOString().slice(0, 10),
        valor: 0,
        status: 'prevista',
      },
    ]);
  }

  const orcamentoItensTotal = React.useMemo(() => {
    if (!roiCase?.orcamentoItens?.length) return null;
    return roiCase.orcamentoItens.reduce((a, i) => a + Number(i.valor || 0), 0);
  }, [roiCase?.orcamentoItens]);

  if (!canReadProjectRoi(role)) {
    return (
      <div className="p-6 text-muted-foreground">Acesso restrito.</div>
    );
  }

  if (lc || !roiCase) {
    return (
      <div className="p-6">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const title =
    roiCase.apelido ||
    roiCase.empreendimentoTexto ||
    roiCase.sourceProposalNumber ||
    roiCase.id;

  async function handleDeleteCase() {
    if (!firestore || !caseId) return;
    setDeleting(true);
    try {
      const { deletedTransactions } = await deleteRoiCase(firestore, caseId, {
        deletedByUid: user?.uid,
        caseLabel: title,
      });
      toast({
        title: 'Projeto excluído',
        description:
          deletedTransactions > 0
            ? `${deletedTransactions} lançamento(s) excluído(s) com registro de auditoria.`
            : 'O caso foi removido.',
      });
      router.push('/financial/projetos-roi');
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: getFirestoreErrorMessage(e),
      });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={title} description="Detalhe do caso — Projetos & ROI">
        <div className="flex flex-wrap gap-2">
          {canDelete && (
            <Button
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/financial/projetos-roi">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <Tabs defaultValue="resumo">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            {!salesReadOnly && (
              <>
                <TabsTrigger value="dre">DRE</TabsTrigger>
                <TabsTrigger value="orcamento">Orçamento</TabsTrigger>
                <TabsTrigger value="extrato">Extrato</TabsTrigger>
                <TabsTrigger value="horas">Horas</TabsTrigger>
                <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
                <TabsTrigger value="lancar" disabled={encerrado || !canWrite}>
                  Lançar
                </TabsTrigger>
                {canWrite && <TabsTrigger value="config">Config</TabsTrigger>}
              </>
            )}
          </TabsList>

          <TabsContent value="resumo" className="mt-4 space-y-4">
            {snap && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <ProjectRoiSemaforoBadge semaforo={snap.semaforo} />
                  <span className="text-sm text-muted-foreground">
                    {roiCase.origin === 'formal' ? 'Formal' : 'Informal'} ·{' '}
                    {roiCase.statusGovernanca}
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <KpiCard label="Orçamento" value={snap.orcamento} />
                  <KpiCard label="Recebido" value={snap.recebido} />
                  {!salesReadOnly && (
                    <>
                      <KpiCard label="Pago" value={snap.pago} />
                      <KpiCard label="Saldo de caixa" value={snap.saldoCaixa} />
                      <KpiCard
                        label="Saldo orçamentário"
                        value={snap.saldoOrcamento}
                      />
                      <KpiCard label="A receber" value={snap.aReceber} />
                      <KpiCard
                        label="Impostos (caso)"
                        value={snap.impostosDespesas + snap.impostosProvisao}
                      />
                      <KpiCard label="Resultado" value={snap.resultado} highlight />
                    </>
                  )}
                  <KpiCard
                    label="Margem %"
                    value={snap.margemPct}
                    isPct
                    highlight={salesReadOnly}
                  />
                  {!salesReadOnly && snap.horasRegistradas > 0 && (
                    <>
                      <KpiCard
                        label="Horas registradas"
                        value={snap.horasRegistradas}
                        isHours
                      />
                      <KpiCard
                        label="Margem / hora"
                        value={snap.margemPorHora}
                      />
                      <KpiCard
                        label="Custo implícito / h"
                        value={snap.custoHoraImplicito}
                      />
                    </>
                  )}
                </div>
                {salesReadOnly && (
                  <p className="text-xs text-muted-foreground">
                    Visão comercial: receita e margem gerencial. Custos detalhados
                    restritos ao financeiro.
                  </p>
                )}
                {snap.aReceber != null && (
                  <p className="text-xs text-muted-foreground">
                    “A receber” = orçamento − recebido (saldo contratual simples; cronograma de
                    parcelas na Fase 2).
                  </p>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="dre" className="mt-4 space-y-4">
            {snap && (
              <>
                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    DRE gerencial deste caso — não altera a DRE Contábil global da
                    empresa.
                  </p>
                  <ProjectRoiExportButtons input={exportInput} layout="wrap" />
                </div>
                <Card>
                  <CardContent className="pt-6">
                    <Table>
                      <TableBody>
                        {[
                          ['Orçamento / receita contratada', snap.orcamento],
                          ['Receitas recebidas', snap.recebido],
                          ['(-) Despesas diretas', snap.pago],
                          ['(-) Impostos pagos (vinculados)', snap.impostosDespesas],
                          ['(-) Provisão imposto (perfil)', snap.impostosProvisao],
                          ['(=) Resultado do projeto', snap.resultado],
                        ].map(([label, val]) => (
                          <TableRow key={String(label)}>
                            <TableCell className="font-medium">{label}</TableCell>
                            <TableCell className="text-right">
                              {formatDreLineValue(Number(val))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="orcamento" className="mt-4 space-y-4">
            {snap && (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <KpiCard label="Orçamento total" value={snap.orcamento} />
                  <KpiCard label="Recebido" value={snap.recebido} />
                  <KpiCard label="Despesas (pago)" value={snap.pago} />
                </div>
                {roiCase.orcamentoItens?.length ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Itens do contrato</CardTitle>
                      <CardDescription>
                        Comparativo simplificado — realizado agregado no caso.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Descrição</TableHead>
                            <TableHead className="text-right">Orçado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {roiCase.orcamentoItens.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{item.descricao}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrencyBRL(item.valor)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell className="font-medium">Total itens</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrencyBRL(orcamentoItensTotal ?? 0)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Sem itens de orçamento no perfil do caso. Defina o valor em
                    contrato formal ou edite manualmente no Firestore.
                  </p>
                )}
                {snap.pctOrcamentoConsumido != null && (
                  <p className="text-xs text-muted-foreground">
                    Despesas consomem {snap.pctOrcamentoConsumido.toFixed(0)}% do
                    orçamento; recebido{' '}
                    {snap.pctRecebido != null
                      ? `${snap.pctRecebido.toFixed(0)}%`
                      : '—'}{' '}
                    do orçamento.
                  </p>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="extrato" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-base">Extrato do caso</CardTitle>
                  <CardDescription>
                    Lançamentos vinculados com saldo de caixa acumulado.
                  </CardDescription>
                </div>
                <ProjectRoiExportButtons input={exportInput} layout="wrap" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Filtro</Label>
                    <Select
                      value={extratoFilter}
                      onValueChange={(v) =>
                        setExtratoFilter(v as 'all' | 'saidas' | 'entradas')
                      }
                    >
                      <SelectTrigger className="w-[180px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="saidas">Só saídas (fornecedores)</SelectItem>
                        <SelectItem value="entradas">Só entradas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="group-supplier"
                      checked={groupBySupplier}
                      onCheckedChange={setGroupBySupplier}
                    />
                    <Label htmlFor="group-supplier" className="text-sm cursor-pointer">
                      Agrupar saídas por fornecedor
                    </Label>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <ExtratoTable
                    lines={snap?.extrato ?? []}
                    filter={extratoFilter}
                    groupBySupplier={groupBySupplier}
                    revenues={revenues ?? undefined}
                    expenses={expenses ?? undefined}
                    canWrite={canWrite}
                    caseId={caseId}
                    encerrado={encerrado}
                    defaultContractId={roiCase.contractId}
                    defaultClientId={roiCase.clientId}
                    defaultProjectId={roiCase.projectId}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="horas" className="mt-4 space-y-4">
            {snap && (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <KpiCard label="Horas estimadas" value={roiCase.horasEstimadas} isHours />
                  <KpiCard label="Horas registradas" value={snap.horasRegistradas} isHours />
                  <KpiCard label="Margem / hora" value={snap.margemPorHora} />
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Timesheet (opcional)</CardTitle>
                    <CardDescription>
                      Soma alimenta automaticamente o campo horas registradas no perfil.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-2 sm:grid-cols-3 items-end">
                      <div>
                        <Label>Data</Label>
                        <Input
                          type="date"
                          value={newEntryDate}
                          onChange={(e) => setNewEntryDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Horas</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={newEntryHours}
                          onChange={(e) => setNewEntryHours(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Atividade</Label>
                        <Input
                          value={newEntryActivity}
                          onChange={(e) => setNewEntryActivity(e.target.value)}
                          placeholder="Campo, revisão…"
                        />
                      </div>
                    </div>
                    {canWrite && (
                      <Button
                        size="sm"
                        onClick={async () => {
                          if (!firestore || !caseId || !newEntryHours) return;
                          try {
                            await addTimeEntry(
                              firestore,
                              caseId,
                              {
                                date: newEntryDate,
                                hours: Number(newEntryHours),
                                activity: newEntryActivity || undefined,
                                userDisplayName: authUser?.displayName || undefined,
                                userId: user?.uid,
                              },
                              user?.uid,
                            );
                            setNewEntryHours('');
                            setNewEntryActivity('');
                            toast({ title: 'Horas registradas' });
                          } catch (e) {
                            console.error(e);
                            toast({ variant: 'destructive', title: 'Erro ao salvar' });
                          }
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar entrada
                      </Button>
                    )}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Horas</TableHead>
                          <TableHead>Atividade</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {timeEntriesRaw?.length ? (
                          [...timeEntriesRaw]
                            .sort((a, b) => (a.date < b.date ? 1 : -1))
                            .map((e) => (
                              <TableRow key={e.id}>
                                <TableCell>{e.date.slice(0, 10)}</TableCell>
                                <TableCell>{e.hours}</TableCell>
                                <TableCell>{e.activity || '—'}</TableCell>
                                <TableCell>
                                  {canWrite && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        void deleteTimeEntry(
                                          firestore!,
                                          caseId,
                                          e.id,
                                          user?.uid,
                                        )
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-muted-foreground text-center">
                              Nenhuma entrada. Use o total manual em Config ou adicione acima.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="fornecedores" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-base">Pagamentos por prestador</CardTitle>
                  <CardDescription>
                    Despesas do caso agrupadas por fornecedor — total pago{' '}
                    {formatCurrencyBRL(supplierSummary.totalPaid)}.
                  </CardDescription>
                </div>
                <ProjectRoiExportButtons input={exportInput} layout="wrap" />
              </CardHeader>
              <CardContent className="p-0">
                {supplierSummary.groups.length ? (
                  <div className="divide-y">
                    {supplierSummary.groups.map((group) => (
                      <Collapsible key={group.supplierId} defaultOpen={false}>
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-muted/50"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{group.supplierName}</p>
                              <p className="text-xs text-muted-foreground">
                                {group.paymentCount} pagamento(s) ·{' '}
                                {group.pctOfCasePaid.toFixed(1)}% do pago no caso
                                {group.lastPaymentDate
                                  ? ` · último: ${group.lastPaymentDate}`
                                  : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="font-semibold">
                                {formatCurrencyBRL(group.totalPaid)}
                              </span>
                              {group.contractedValue != null && (
                                <span className="text-xs text-muted-foreground hidden sm:inline">
                                  contratado {formatCurrencyBRL(group.contractedValue)}
                                </span>
                              )}
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.payments.map((p) => (
                                <TableRow key={p.id}>
                                  <TableCell>{p.date}</TableCell>
                                  <TableCell>{p.description}</TableCell>
                                  <TableCell className="text-xs">
                                    {expenseCategoryLabel(p.category)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrencyBRL(p.amount)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                ) : (
                  <p className="p-4 text-sm text-center text-muted-foreground">
                    Nenhuma despesa vinculada a este caso.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contratos com fornecedores</CardTitle>
                <CardDescription>
                  Vinculados a este caso via campo Projeto & ROI no contrato-fornecedor.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº</TableHead>
                      <TableHead>Prestador</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linkedSupplierContracts.length ? (
                      linkedSupplierContracts.map((sc) => (
                        <TableRow key={sc.id}>
                          <TableCell>{sc.contractNumber}</TableCell>
                          <TableCell>{sc.prestador.nome}</TableCell>
                          <TableCell>
                            {formatCurrencyBRL(sc.pagamento.valorTotal)}
                          </TableCell>
                          <TableCell>{sc.status}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Nenhum contrato-fornecedor vinculado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lancar" className="mt-4 space-y-4">
            {encerrado ? (
              <p className="text-sm text-muted-foreground">
                Caso encerrado. Reabra o caso em Config. para novos lançamentos gerenciais.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/40">
                  Lançamento gerencial deste projeto. Não entra no Fluxo de Caixa nem na DRE
                  global da empresa — serve apenas para controlo de rentabilidade e prestadores.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant={lancarTipo === 'revenue' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLancarTipo('revenue')}
                  >
                    Receita
                  </Button>
                  <Button
                    variant={lancarTipo === 'expense' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLancarTipo('expense')}
                  >
                    Despesa
                  </Button>
                </div>
                <TransactionForm
                  key={`${lancarTipo}-${caseId}`}
                  transactionType={lancarTipo}
                  defaultProjectRoiCaseId={caseId}
                  defaultContractId={roiCase.contractId}
                  defaultClientId={roiCase.clientId}
                  defaultProjectId={roiCase.projectId}
                  onSuccess={() => {
                    toast({
                      title: 'Lançamento gerencial salvo',
                      description: 'Registrado neste caso (não entra no caixa da empresa).',
                    });
                  }}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="config" className="mt-4 space-y-4 max-w-lg">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Perfil do caso</CardTitle>
                <CardDescription>
                  Provisão de imposto aqui é só para esta visão gerencial — não altera a DRE
                  Contábil global.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Apelido</Label>
                  <Input value={apelido} onChange={(e) => setApelido(e.target.value)} />
                </div>
                <div>
                  <Label>Horas estimadas</Label>
                  <Input
                    type="number"
                    value={horasEstimadas}
                    onChange={(e) => setHorasEstimadas(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Horas registradas (total manual)</Label>
                  <Input
                    type="number"
                    value={horasRegistradasManual}
                    onChange={(e) => setHorasRegistradasManual(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Sobrescreve a soma do timesheet se preenchido. Deixe vazio para usar só
                    entradas da aba Horas.
                  </p>
                </div>
                <div>
                  <Label>Alíquota imposto % (sobre recebido)</Label>
                  <Input
                    type="number"
                    value={aliquotaPct}
                    onChange={(e) => setAliquotaPct(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Provisão imposto (valor fixo R$)</Label>
                  <Input
                    type="number"
                    value={impostoFixo}
                    onChange={(e) => setImpostoFixo(e.target.value)}
                  />
                </div>
                <Button onClick={() => void saveConfig()}>Salvar perfil</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Parcelas previstas</CardTitle>
                <CardDescription>
                  Cronograma de recebimento (Fase 2) — não altera o Caixa
                  automaticamente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {parcelas.map((p, idx) => (
                  <div
                    key={p.id}
                    className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] items-end border-b pb-3"
                  >
                    <div>
                      <Label>Vencimento</Label>
                      <Input
                        type="date"
                        value={p.vencimento.slice(0, 10)}
                        onChange={(e) => {
                          const next = [...parcelas];
                          next[idx] = { ...p, vencimento: e.target.value };
                          setParcelas(next);
                        }}
                      />
                    </div>
                    <div>
                      <Label>Valor (R$)</Label>
                      <Input
                        type="number"
                        value={p.valor || ''}
                        onChange={(e) => {
                          const next = [...parcelas];
                          next[idx] = {
                            ...p,
                            valor: Number(e.target.value) || 0,
                          };
                          setParcelas(next);
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setParcelas((prev) => prev.filter((_, i) => i !== idx))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addParcela}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar parcela
                </Button>
              </CardContent>
            </Card>

            {roiCase.origin === 'manual' && !roiCase.contractId && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Vincular contrato formal</CardTitle>
                  <CardDescription>
                    Promove o caso para formal quando o contrato aprovado tem
                    arquivo assinado.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={linkContractId} onValueChange={setLinkContractId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Contrato aprovado" />
                    </SelectTrigger>
                    <SelectContent>
                      {contracts
                        ?.filter((c) => c.fileUrl?.trim())
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.objeto?.empreendimento ?? c.id} —{' '}
                            {new Date(c.dataContrato).toLocaleDateString('pt-BR')}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button
                    disabled={!linkContractId || linkingContract}
                    onClick={() => void handleLinkContract()}
                  >
                    {linkingContract ? 'Vinculando…' : 'Vincular contrato'}
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              {encerrado ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!firestore) return;
                    void reabrirRoiCase(firestore, roiCase, user?.uid).then(() =>
                      toast({ title: 'Caso reaberto' }),
                    );
                  }}
                >
                  Reabrir caso
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (!firestore) return;
                    void encerrarRoiCase(firestore, roiCase.id, user?.uid).then(() => {
                      toast({ title: 'Caso encerrado' });
                      router.refresh();
                    });
                  }}
                >
                  Encerrar caso
                </Button>
              )}
            </div>
            {roiCase.contractId && (
              <Button variant="link" asChild className="px-0">
                <Link href={`/contracts/${roiCase.contractId}/edit`}>Abrir contrato</Link>
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              O caso &quot;{title}&quot; será removido permanentemente.
              Lançamentos vinculados serão desclassificados (permanecem no
              sistema).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteCase();
              }}
            >
              {deleting ? 'Excluindo…' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function filterExtratoLines(
  lines: ProjectRoiExtratoLine[],
  filter: 'all' | 'saidas' | 'entradas',
): ProjectRoiExtratoLine[] {
  if (filter === 'all') return lines;
  if (filter === 'saidas') {
    return lines.filter(
      (l) =>
        l.kind === 'expense' ||
        (l.kind === 'revenue' && isAbatimentoExtratoLine(l)),
    );
  }
  return lines.filter(
    (l) =>
      l.kind === 'orcamento_credito' ||
      l.kind === 'invoice_paid' ||
      (l.kind === 'revenue' && !isAbatimentoExtratoLine(l)),
  );
}

function resolveExtratoTransactionItem(
  line: ProjectRoiExtratoLine,
  revenues?: Revenue[],
  expenses?: Expense[],
): { item: Revenue | Expense; kind: 'revenue' | 'expense' } | null {
  if (line.kind === 'orcamento_credito') return null;
  if (line.kind !== 'revenue' && line.kind !== 'expense') return null;

  const item =
    line.kind === 'revenue'
      ? revenues?.find((r) => r.id === line.id)
      : expenses?.find((e) => e.id === line.id);

  if (!item || item.deletedAt || item.isEstorno) return null;

  return { item, kind: line.kind };
}

function ExtratoTable({
  lines,
  filter,
  groupBySupplier,
  revenues,
  expenses,
  canWrite,
  caseId,
  encerrado,
  defaultContractId,
  defaultClientId,
  defaultProjectId,
}: {
  lines: ProjectRoiExtratoLine[];
  filter: 'all' | 'saidas' | 'entradas';
  groupBySupplier: boolean;
  revenues?: Revenue[];
  expenses?: Expense[];
  canWrite?: boolean;
  caseId: string;
  encerrado: boolean;
  defaultContractId?: string;
  defaultClientId?: string;
  defaultProjectId?: string;
}) {
  const filtered = filterExtratoLines(lines, filter);

  const nonExpenses = filtered.filter((l) => l.kind !== 'expense');
  const expenseLines = filtered.filter((l) => l.kind === 'expense');

  const expenseGroups = React.useMemo(() => {
    const map = new Map<string, ProjectRoiExtratoLine[]>();
    for (const line of expenseLines) {
      const key = line.supplierId || line.counterparty || '__sem_fornecedor__';
      const list = map.get(key) ?? [];
      list.push(line);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => {
      const totalA = a[1].reduce((s, l) => s + l.amount, 0);
      const totalB = b[1].reduce((s, l) => s + l.amount, 0);
      return totalB - totalA;
    });
  }, [expenseLines]);

  if (!filtered.length) {
    return (
      <p className="text-sm text-center text-muted-foreground py-6">
        Nenhum lançamento para o filtro selecionado.
      </p>
    );
  }

  const headers = (
    <TableRow>
      <TableHead className="whitespace-nowrap">Data</TableHead>
      <TableHead className="whitespace-nowrap">Tipo</TableHead>
      <TableHead>Descrição</TableHead>
      <TableHead className="whitespace-nowrap">Contraparte</TableHead>
      <TableHead className="whitespace-nowrap">Categoria</TableHead>
      <TableHead className="whitespace-nowrap text-right">Imposto</TableHead>
      <TableHead className="whitespace-nowrap text-right">Valor</TableHead>
      <TableHead className="whitespace-nowrap text-right">Saldo acum.</TableHead>
      <TableHead className="whitespace-nowrap">Status</TableHead>
      <TableHead className="w-10" />
      <TableHead className="w-[160px]" />
    </TableRow>
  );

  const renderRow = (line: ProjectRoiExtratoLine) => (
    <TableRow key={`${line.sourceCollection}-${line.id}`}>
      <TableCell className="whitespace-nowrap">{line.date}</TableCell>
      <TableCell className="text-xs whitespace-nowrap">
        {extratoLineTipoLabel(line)}
      </TableCell>
      <TableCell className="max-w-[200px] truncate" title={line.description}>
        {line.description}
      </TableCell>
      <TableCell className="whitespace-nowrap">{line.counterparty ?? '—'}</TableCell>
      <TableCell className="text-xs whitespace-nowrap">
        {line.kind === 'expense' ? expenseCategoryLabel(line.category) : '—'}
      </TableCell>
      <TableCell className="text-right text-xs whitespace-nowrap">
        {line.impostoValor != null && line.impostoValor > 0
          ? formatCurrencyBRL(line.impostoValor)
          : '—'}
      </TableCell>
      <TableCell className="text-right whitespace-nowrap">
        <ExtratoValorCell line={line} />
      </TableCell>
      <TableCell className="text-right text-xs whitespace-nowrap">
        {line.saldoAcumulado != null
          ? formatCurrencyBRL(line.saldoAcumulado)
          : '—'}
      </TableCell>
      <TableCell>
        {line.isEstorno ? (
          <Badge variant="secondary" className="text-xs">
            Legado
          </Badge>
        ) : (
          '—'
        )}
      </TableCell>
      <TableCell>
        {line.hasComprovante && line.fileUrl ? (
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <a href={line.fileUrl} target="_blank" rel="noopener noreferrer">
              <Paperclip className="h-4 w-4" />
              <span className="sr-only">Comprovante</span>
            </a>
          </Button>
        ) : line.hasComprovante ? (
          <Paperclip className="h-4 w-4 text-muted-foreground" />
        ) : null}
      </TableCell>
      <TableCell>
        {canWrite ? (
          <div className="flex flex-wrap items-center gap-1">
            <ExtratoEditarButton
              line={line}
              revenues={revenues}
              expenses={expenses}
              caseId={caseId}
              encerrado={encerrado}
              defaultContractId={defaultContractId}
              defaultClientId={defaultClientId}
              defaultProjectId={defaultProjectId}
            />
            <ExtratoExcluirButton
              line={line}
              revenues={revenues}
              expenses={expenses}
            />
          </div>
        ) : null}
      </TableCell>
    </TableRow>
  );

  if (groupBySupplier && filter !== 'entradas') {
    return (
      <Table>
        <TableHeader>{headers}</TableHeader>
        <TableBody>
          {nonExpenses.map(renderRow)}
          {expenseGroups.map(([key, groupLines]) => {
            const name =
              groupLines[0]?.counterparty ||
              (key === '__sem_fornecedor__' ? 'Sem fornecedor' : key);
            const subtotal = groupLines.reduce((a, l) => a + l.amount, 0);
            return (
              <React.Fragment key={key}>
                <TableRow className="bg-muted/40">
                  <TableCell colSpan={6} className="font-medium">
                    {name}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrencyBRL(subtotal)}
                  </TableCell>
                  <TableCell colSpan={4} />
                </TableRow>
                {groupLines.map(renderRow)}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>{headers}</TableHeader>
      <TableBody>{filtered.map(renderRow)}</TableBody>
    </Table>
  );
}

function ExtratoValorCell({ line }: { line: ProjectRoiExtratoLine }) {
  const formatted = formatCurrencyBRL(line.amount);
  if (extratoValorVariant(line) === 'credito') {
    return (
      <span className="font-bold text-blue-600 dark:text-blue-400">{formatted}</span>
    );
  }
  return (
    <span className="font-bold text-red-600 dark:text-red-400">{formatted}</span>
  );
}

function ExtratoEditarButton({
  line,
  revenues,
  expenses,
  caseId,
  encerrado,
  defaultContractId,
  defaultClientId,
  defaultProjectId,
}: {
  line: ProjectRoiExtratoLine;
  revenues?: Revenue[];
  expenses?: Expense[];
  caseId: string;
  encerrado: boolean;
  defaultContractId?: string;
  defaultClientId?: string;
  defaultProjectId?: string;
}) {
  if (encerrado) return null;

  const resolved = resolveExtratoTransactionItem(line, revenues, expenses);
  if (!resolved) return null;

  return (
    <EditRoiTransactionButton
      item={resolved.item}
      kind={resolved.kind}
      caseId={caseId}
      defaultContractId={defaultContractId}
      defaultClientId={defaultClientId}
      defaultProjectId={defaultProjectId}
    />
  );
}

function ExtratoExcluirButton({
  line,
  revenues,
  expenses,
}: {
  line: ProjectRoiExtratoLine;
  revenues?: Revenue[];
  expenses?: Expense[];
}) {
  const resolved = resolveExtratoTransactionItem(line, revenues, expenses);
  if (!resolved) return null;

  return (
    <DeleteRoiTransactionButton
      item={resolved.item}
      kind={resolved.kind}
    />
  );
}

function KpiCard({
  label,
  value,
  highlight,
  isPct,
  isHours,
}: {
  label: string;
  value: number | null | undefined;
  highlight?: boolean;
  isPct?: boolean;
  isHours?: boolean;
}) {
  let display = '—';
  if (value != null && Number.isFinite(Number(value))) {
    if (isPct) display = `${Number(value).toFixed(1)}%`;
    else if (isHours) display = `${Number(value).toFixed(1)} h`;
    else display = formatCurrencyBRL(Number(value));
  }
  return (
    <Card className={highlight ? 'border-primary/40' : undefined}>
      <CardHeader className="pb-1">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-lg">{display}</CardTitle>
      </CardHeader>
    </Card>
  );
}
