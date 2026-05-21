'use client';
import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose
} from '@/components/ui/dialog';
import { PlusCircle, Eye, Pencil, Trash2, FileText, CheckCircle, FolderOpen, Mail } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase, errorEmitter } from '@/firebase';
import {
  collection,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import type { Request, Empreendedor, Project, AppUser } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/firebase';
import { CardSearchInput } from '@/components/card-search-input';
import {
  INTERVENTION_SERVICE_LABEL,
  getChecklistStatusBadgeClass,
  getChecklistStatusLabel,
  type InterventionChecklistItem,
} from '@/lib/intervention-checklist';
import { canAdvanceRequestStatus } from '@/lib/aia-validation';
import { sortStringsPt } from '@/lib/sort-pt-br';
import { cn } from '@/lib/utils';
import { fetchEmpreendedorIdsForProcessosPortal } from '@/lib/requests-portal-empreendedor-ids';
import { downloadJsPdf } from '@/lib/branding-pdf';
import {
  buildLicenciamentoTramiteMailto,
  formatLicenciamentoSolicitationNumber,
  getLicenciamentoStatusLabel,
  licenciamentoTramitePdfFilename,
  type LicenciamentoTramiteReportContext,
} from '@/lib/licenciamento-tramite-report';
import { buildLicenciamentoTramitePdf } from '@/lib/licenciamento-tramite-pdf';
import {
  LICENCIAMENTO_MENU_LABEL,
  LICENCIAMENTO_NEW_SUBITEM_LABEL,
} from '@/lib/licenciamento-menu';
import {
  brandingUrlsFromLocal,
  createMmBrandedPdfSession,
  guardBrandingPdfExport,
} from '@/lib/pdf-branding-layout';
import { useLocalBranding } from '@/hooks/use-local-branding';
import {
  canWriteProcessosInternal,
  isProcessosPortalReadOnlyRole,
  isProcessosPortalScopeRole,
} from '@/lib/role-guards';

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value?: string | string[] | null;
}) => (
  <div className="space-y-1">
    <Label className="text-sm font-medium">{label}</Label>
    {Array.isArray(value) ? (
      <ul className="list-disc pl-5 text-sm text-muted-foreground">
        {value.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
        {value?.trim() ? value : 'Não informado'}
      </p>
    )}
  </div>
);

function statusBadgeClass(status: Request['status']) {
  return cn(
    status === 'Completed' &&
      'bg-emerald-500/20 text-emerald-700 border-emerald-500/30 dark:text-emerald-400',
    status === 'In Progress' &&
      'bg-blue-500/20 text-blue-800 border-blue-500/30 dark:text-blue-300',
    status === 'Submitted' &&
      'bg-amber-500/20 text-amber-800 border-amber-500/30 dark:text-amber-300',
  );
}

function formatTramiteDate(timestamp: unknown): string {
  if (!timestamp) return 'N/A';
  try {
    const date =
      typeof timestamp === 'object' &&
      timestamp !== null &&
      'toDate' in timestamp &&
      typeof (timestamp as { toDate: () => Date }).toDate === 'function'
        ? (timestamp as { toDate: () => Date }).toDate()
        : typeof timestamp === 'object' &&
            timestamp !== null &&
            'seconds' in timestamp
          ? new Date((timestamp as { seconds: number }).seconds * 1000)
          : new Date(String(timestamp));
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('pt-BR');
    }
  } catch (e) {
    console.error('Error formatting timestamp:', e);
  }
  return 'Data inválida';
}

type RequestTramiteCardProps = {
  item: Request;
  empreendedorName: string;
  empreendimentoName: string;
  solicitationNumber: string;
  statusLabel: string;
  checklistProgress: string | null;
  licensingSummary: string | null;
  canWriteInternal: boolean;
  isPortalReadOnly: boolean;
  showManageActions: boolean;
  onView: (item: Request) => void;
  onEdit: (item: Request) => void;
  onOpen: (item: Request) => void;
  onAdvance: (item: Request) => void;
  onExportPdf: (item: Request) => void;
  onShareEmail: (item: Request) => void;
  onDelete: (itemId: string) => void;
};

function RequestTramiteCard({
  item,
  empreendedorName,
  empreendimentoName,
  solicitationNumber,
  statusLabel,
  checklistProgress,
  licensingSummary,
  canWriteInternal,
  isPortalReadOnly,
  showManageActions,
  onView,
  onEdit,
  onOpen,
  onAdvance,
  onExportPdf,
  onShareEmail,
  onDelete,
}: RequestTramiteCardProps) {
  const servicesLabel =
    item.services?.length ? item.services.join(', ') : 'Não informado';

  return (
    <Card className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-mono text-base font-semibold tabular-nums leading-snug text-foreground sm:text-lg">
                {solicitationNumber}
              </h3>
              <Badge
                variant={item.status === 'Completed' ? 'default' : 'outline'}
                className={statusBadgeClass(item.status)}
              >
                {statusLabel}
              </Badge>
            </div>
            <p className="text-sm text-foreground">
              <span className="text-muted-foreground">Empreendedor: </span>
              {empreendedorName}
            </p>
            <p className="text-sm text-foreground">
              <span className="text-muted-foreground">Empreendimento: </span>
              {empreendimentoName}
            </p>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Criado em {formatTramiteDate(item.createdAt)}
            </p>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {servicesLabel}
            </p>
            {(licensingSummary || checklistProgress) && (
              <div className="flex flex-wrap gap-2 pt-0.5">
                {licensingSummary ? (
                  <Badge variant="secondary" className="font-normal">
                    Licenciamento: {licensingSummary}
                  </Badge>
                ) : null}
                {checklistProgress ? (
                  <Badge variant="outline" className="font-normal">
                    Checklist AIA: {checklistProgress}
                  </Badge>
                ) : null}
              </div>
            )}
          </div>
          <Separator className="bg-border/60" />
          <div className="flex flex-wrap items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => onView(item)}
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">Visualizar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Resumo rápido</p>
              </TooltipContent>
            </Tooltip>
            {isPortalReadOnly && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1 px-2"
                    onClick={() => onOpen(item)}
                  >
                    <FolderOpen className="h-4 w-4" />
                    <span className="hidden sm:inline">Abrir</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ver trâmite, anexos e tramitação</p>
                </TooltipContent>
              </Tooltip>
            )}
            {showManageActions && canWriteInternal && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => onEdit(item)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Editar trâmite</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => onAdvance(item)}
                    >
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="sr-only">Avançar status</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Avançar status</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => onExportPdf(item)}
                >
                  <FileText className="h-4 w-4" />
                  <span className="sr-only">Exportar PDF</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Exportar PDF do trâmite</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => onShareEmail(item)}
                >
                  <Mail className="h-4 w-4" />
                  <span className="sr-only">Enviar por e-mail</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enviar resumo por e-mail</p>
              </TooltipContent>
            </Tooltip>
            {showManageActions && canWriteInternal && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                    onClick={() => onDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Excluir</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Excluir trâmite</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatCriterioLocacionalLabel(c: '0' | '1' | '2'): string {
  switch (c) {
    case '0':
      return '0 - Sem critério';
    case '1':
      return '1 - Médio';
    case '2':
      return '2 - Alto';
    default:
      return String(c);
  }
}

function locationalInputModeLabel(mode: string): string {
  const map: Record<string, string> = {
    car: 'CAR',
    polygon: 'GeoJSON',
    coordinates: 'Coordenadas',
    draw: 'Desenho no mapa',
  };
  return map[mode] ?? mode;
}

const canWrite = (user: AppUser | null): boolean => {
  if (!user) return false;
  return canWriteProcessosInternal(user.role);
};

function isPortalRequestsScopeRole(role: AppUser['role']): boolean {
  return isProcessosPortalScopeRole(role);
}

const getStatusLabel = (status: Request['status']) =>
  getLicenciamentoStatusLabel(status);

const STATUS_FLOW: Request['status'][] = ['Draft', 'Submitted', 'In Progress', 'Completed'];

const getNextStatus = (status: Request['status']): Request['status'] | null => {
  const idx = STATUS_FLOW.indexOf(status);
  if (idx < 0 || idx === STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
};

export default function RequestsPage() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<Request | null>(null);
  const [searchDraft, setSearchDraft] = useState('');
  const [searchApproved, setSearchApproved] = useState('');
  const [empreendedorIdsForUser, setEmpreendedorIdsForUser] = useState<
    string[] | undefined
  >(undefined);
  const router = useRouter();

  const { user } = useAuth();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const { data: brandingData, isPdfImagesLoading, hasBrandingUrls } =
    useLocalBranding();

  useEffect(() => {
    if (!firestore || !user) return;
    if (!isProcessosPortalScopeRole(user.role)) {
      setEmpreendedorIdsForUser([]);
      return;
    }
    setEmpreendedorIdsForUser(undefined);
    fetchEmpreendedorIdsForProcessosPortal(firestore, user)
      .then(setEmpreendedorIdsForUser)
      .catch(() => setEmpreendedorIdsForUser(['invalid-placeholder']));
  }, [user, firestore]);

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !user || empreendedorIdsForUser === undefined) return null;
    if (isPortalRequestsScopeRole(user.role)) {
      if (empreendedorIdsForUser.length > 0) {
        return query(
          collection(firestore, 'requests'),
          where('empreendedorId', 'in', empreendedorIdsForUser),
        );
      }
      return query(
        collection(firestore, 'requests'),
        where('empreendedorId', 'in', ['invalid-placeholder']),
      );
    }
    return collection(firestore, 'requests');
  }, [firestore, user, empreendedorIdsForUser]);

  const { data: requests, isLoading: isLoadingRequests } = useCollection<Request>(requestsQuery);

  const empreendedoresQuery = useMemoFirebase(() => firestore ? collection(firestore, 'empreendedores') : null, [firestore]);
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } = useCollection<Empreendedor>(empreendedoresQuery);
  const empreendedoresMap = React.useMemo(() => new Map(empreendedores?.map(e => [e.id, e.name])), [empreendedores]);

  const projectsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
  const { data: projects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);
  const projectsMap = React.useMemo(() => new Map(projects?.map(p => [p.id, p.propertyName])), [projects]);

  const isLoading =
    isLoadingRequests ||
    isLoadingEmpreendedores ||
    isLoadingProjects ||
    (user && isPortalRequestsScopeRole(user.role) && empreendedorIdsForUser === undefined);

  const { draftRequests, approvedRequests } = useMemo(() => {
    if (!requests) return { draftRequests: [], approvedRequests: [] };
    const drafts = requests.filter(r => r.status !== 'Completed');
    const approved = requests.filter(r => r.status === 'Completed');
    return { draftRequests: drafts, approvedRequests: approved };
  }, [requests]);
  const filteredDraftRequests = useMemo(() => {
    const term = searchDraft.trim().toLowerCase();
    const base = !term
      ? draftRequests
      : draftRequests.filter((item) => {
      const empreendedor = (empreendedoresMap.get(item.empreendedorId) || '').toLowerCase();
      const empreendimento = (projectsMap.get(item.projectId) || '').toLowerCase();
      return (
        getSolicitationNumber(item).toLowerCase().includes(term) ||
        getStatusLabel(item.status).toLowerCase().includes(term) ||
        (item.services?.join(', ') || '').toLowerCase().includes(term) ||
        empreendedor.includes(term) ||
        empreendimento.includes(term)
      );
    });
    return [...base].sort((a, b) =>
      getSolicitationNumber(a).localeCompare(getSolicitationNumber(b), 'pt-BR', {
        sensitivity: 'base',
      }),
    );
  }, [draftRequests, empreendedoresMap, projectsMap, searchDraft]);
  const filteredApprovedRequests = useMemo(() => {
    const term = searchApproved.trim().toLowerCase();
    const base = !term
      ? approvedRequests
      : approvedRequests.filter((item) => {
      const empreendedor = (empreendedoresMap.get(item.empreendedorId) || '').toLowerCase();
      const empreendimento = (projectsMap.get(item.projectId) || '').toLowerCase();
      return (
        getSolicitationNumber(item).toLowerCase().includes(term) ||
        getStatusLabel(item.status).toLowerCase().includes(term) ||
        (item.services?.join(', ') || '').toLowerCase().includes(term) ||
        empreendedor.includes(term) ||
        empreendimento.includes(term)
      );
    });
    return [...base].sort((a, b) =>
      getSolicitationNumber(a).localeCompare(getSolicitationNumber(b), 'pt-BR', {
        sensitivity: 'base',
      }),
    );
  }, [approvedRequests, empreendedoresMap, projectsMap, searchApproved]);

  const handleAddNew = () => {
    router.push('/requests/new');
  };

  const handleEdit = (item: Request) => {
    router.push(`/requests/${item.id}/edit`);
  };
  
  const handleView = (item: Request) => {
    setViewingItem(item);
    setIsViewOpen(true);
  };
  
  const getChecklistProgress = (item: Request) => {
    if (!item.interventionChecklist || item.interventionChecklist.length === 0) return null;
    const requiredItems = item.interventionChecklist.filter((c) => c.required);
    const requiredDone = requiredItems.filter((c) => c.status === 'completed').length;
    return `${requiredDone}/${requiredItems.length || item.interventionChecklist.length}`;
  };

  const getRequiredPendingCount = (item: Request) => {
    if (!item.interventionChecklist || item.interventionChecklist.length === 0) return 0;
    return item.interventionChecklist.filter((c) => c.required && c.status !== 'completed').length;
  };

  const getStatusBreakdown = (item: Request) => {
    const checklist = item.interventionChecklist || [];
    const counters: Record<InterventionChecklistItem['status'], number> = {
      not_started: 0,
      collecting: 0,
      not_applicable: 0,
      completed: 0,
    };
    checklist.forEach((c) => {
      counters[c.status] += 1;
    });
    return counters;
  };

  const canAdvanceStatus = (item: Request): { allowed: boolean; reason?: string } => {
    const next = getNextStatus(item.status);
    if (!next) return { allowed: false, reason: 'Trâmite já está concluído.' };
    return canAdvanceRequestStatus(item, next);
  };

  const handleAdvanceStatus = (item: Request) => {
      if (!firestore) return;
      const nextStatus = getNextStatus(item.status);
      if (!nextStatus) {
        toast({ title: 'Sem avanço disponível', description: 'Este trâmite já está concluído.' });
        return;
      }

      const gate = canAdvanceStatus(item);
      if (!gate.allowed) {
        toast({ variant: 'destructive', title: 'Não é possível avançar', description: gate.reason });
        return;
      }

      const requestRef = doc(firestore, 'requests', item.id);
      updateDoc(requestRef, { status: nextStatus })
        .then(() => {
          toast({
            title: 'Status atualizado',
            description: `Trâmite avançou para ${getStatusLabel(nextStatus)}.`,
          });
        })
        .catch(async () => {
          const permissionError = new FirestorePermissionError({
            path: requestRef.path,
            operation: 'update',
            requestResourceData: { status: nextStatus },
          });
          errorEmitter.emit('permission-error', permissionError);
        });
  }
  
  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'requests', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({ title: 'Trâmite excluído', description: 'O registro foi removido com sucesso.' });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({ path: docRef.path, operation: 'delete' });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsAlertOpen(false);
        setItemToDelete(null);
      });
  };

  function getSolicitationNumber(request: Request) {
    return formatLicenciamentoSolicitationNumber(request);
  }

  const getLicensingSummary = (item: Request): string | null => {
    if (
      !item.services?.includes('Licenciamento ambiental') ||
      !item.licensingData
    ) {
      return null;
    }
    return `C${item.licensingData.grading.classeSugerida} · ${item.licensingData.grading.modalidadeSugerida}`;
  };

  const isPortalReadOnly = Boolean(
    user && isProcessosPortalReadOnlyRole(user.role),
  );
  const canWriteInternal = canWrite(user);

  function buildReportContext(item: Request): LicenciamentoTramiteReportContext {
    return {
      request: item,
      solicitationNumber: getSolicitationNumber(item),
      statusLabel: getStatusLabel(item.status),
      empreendedorName: empreendedoresMap.get(item.empreendedorId),
      projectName: projectsMap.get(item.projectId),
    };
  }

  const handleExportPdf = async (item: Request) => {
    if (
      !guardBrandingPdfExport({
        isPdfImagesLoading,
        hasBrandingUrls,
        toast,
      })
    ) {
      return;
    }
    const ctx = buildReportContext(item);
    toast({
      title: 'Gerando PDF…',
      description: 'Resumo do trâmite com identidade visual da consultoria.',
    });
    try {
      const session = await createMmBrandedPdfSession(
        brandingUrlsFromLocal(brandingData),
      );
      await buildLicenciamentoTramitePdf(
        session.doc,
        ctx,
        session,
        session.startY,
      );
      session.finalize();
      downloadJsPdf(session.doc, licenciamentoTramitePdfFilename(ctx));
      toast({
        title: 'PDF gerado',
        description: `Arquivo ${licenciamentoTramitePdfFilename(ctx)} descarregado.`,
      });
    } catch (e) {
      console.error('[licenciamento-pdf]', e);
      toast({
        variant: 'destructive',
        title: 'Erro ao gerar PDF',
        description:
          e instanceof Error ? e.message : 'Não foi possível exportar o trâmite.',
      });
    }
  };

  const handleShareEmail = (item: Request) => {
    const { mailtoUrl } = buildLicenciamentoTramiteMailto(buildReportContext(item));
    window.location.href = mailtoUrl;
  };

  const tramiteCardCommonProps = {
    canWriteInternal,
    isPortalReadOnly,
    onView: handleView,
    onEdit: handleEdit,
    onOpen: (item: Request) => router.push(`/requests/${item.id}/edit`),
    onAdvance: handleAdvanceStatus,
    onExportPdf: handleExportPdf,
    onShareEmail: handleShareEmail,
    onDelete: openDeleteConfirm,
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title={LICENCIAMENTO_MENU_LABEL}>
          {canWrite(user) ? (
            <Button size="sm" className="gap-1" onClick={handleAddNew}>
              <PlusCircle className="h-4 w-4" />
              {LICENCIAMENTO_NEW_SUBITEM_LABEL}
            </Button>
          ) : null}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trâmites em elaboração</CardTitle>
              <CardDescription>
                {isPortalReadOnly
                  ? 'Trâmites em andamento vinculados aos empreendedores do seu acesso. Apenas visualização: abra o trâmite para ver detalhes, anexos e tramitação.'
                  : 'Visualize e gerencie solicitações ambientais (licenciamento, AIA, outorga e correlatos) em andamento.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    {draftRequests.length
                      ? `Total: ${draftRequests.length} trâmite(s) em elaboração`
                      : null}
                  </div>
                  <CardSearchInput
                    value={searchDraft}
                    onChange={setSearchDraft}
                    placeholder="Buscar trâmite, status, empreendedor..."
                    className="w-full"
                  />
                </div>
                <TooltipProvider>
                  <div className="space-y-4">
                    {isLoading &&
                      Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton
                          key={i}
                          className="h-28 w-full rounded-lg"
                        />
                      ))}
                    {!isLoading &&
                      filteredDraftRequests.map((item) => (
                        <RequestTramiteCard
                          key={item.id}
                          item={item}
                          empreendedorName={
                            empreendedoresMap.get(item.empreendedorId) || 'N/A'
                          }
                          empreendimentoName={
                            projectsMap.get(item.projectId) || 'N/A'
                          }
                          solicitationNumber={getSolicitationNumber(item)}
                          statusLabel={getStatusLabel(item.status)}
                          checklistProgress={
                            item.services?.includes(INTERVENTION_SERVICE_LABEL)
                              ? getChecklistProgress(item)
                              : null
                          }
                          licensingSummary={getLicensingSummary(item)}
                          showManageActions
                          {...tramiteCardCommonProps}
                        />
                      ))}
                    {!isLoading && filteredDraftRequests.length === 0 && (
                      <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-sm text-muted-foreground">
                        {searchDraft.trim()
                          ? 'Nenhum trâmite encontrado para o filtro atual.'
                          : 'Nenhuma solicitação em elaboração.'}
                      </div>
                    )}
                  </div>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trâmites concluídos</CardTitle>
              <CardDescription>
                {isPortalReadOnly
                  ? 'Histórico de trâmites finalizados. Pode consultar e descarregar anexos; não é possível alterar dados.'
                  : 'Histórico de solicitações ambientais já finalizadas.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    {approvedRequests.length
                      ? `Total: ${approvedRequests.length} trâmite(s) concluído(s)`
                      : null}
                  </div>
                  <CardSearchInput
                    value={searchApproved}
                    onChange={setSearchApproved}
                    placeholder="Buscar no histórico..."
                    className="w-full"
                  />
                </div>
                <TooltipProvider>
                  <div className="space-y-4">
                    {isLoading &&
                      Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton
                          key={i}
                          className="h-28 w-full rounded-lg"
                        />
                      ))}
                    {!isLoading &&
                      filteredApprovedRequests.map((item) => (
                        <RequestTramiteCard
                          key={item.id}
                          item={item}
                          empreendedorName={
                            empreendedoresMap.get(item.empreendedorId) || 'N/A'
                          }
                          empreendimentoName={
                            projectsMap.get(item.projectId) || 'N/A'
                          }
                          solicitationNumber={getSolicitationNumber(item)}
                          statusLabel={getStatusLabel(item.status)}
                          checklistProgress={
                            item.services?.includes(INTERVENTION_SERVICE_LABEL)
                              ? getChecklistProgress(item)
                              : null
                          }
                          licensingSummary={getLicensingSummary(item)}
                          showManageActions={false}
                          {...tramiteCardCommonProps}
                        />
                      ))}
                    {!isLoading && filteredApprovedRequests.length === 0 && (
                      <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-sm text-muted-foreground">
                        {searchApproved.trim()
                          ? 'Nenhum trâmite encontrado para o filtro atual.'
                          : 'Nenhum trâmite concluído.'}
                      </div>
                    )}
                  </div>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Detalhes do trâmite</DialogTitle>
                <DialogDescription>
                    Visualização dos dados da solicitação.
                </DialogDescription>
            </DialogHeader>
            {viewingItem && (
                <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
                    <DetailItem label="Nº do trâmite" value={getSolicitationNumber(viewingItem)} />
                    <DetailItem label="Empreendedor" value={empreendedoresMap.get(viewingItem.empreendedorId)} />
                    <DetailItem label="Empreendimento" value={projectsMap.get(viewingItem.projectId)} />
                    <Separator />
                    <DetailItem
                      label="Serviços Solicitados"
                      value={sortStringsPt(viewingItem.services ?? [])}
                    />
                    {viewingItem.services.includes('Licenciamento ambiental') && viewingItem.licensingData && (
                      <>
                        <DetailItem
                          label="Licenciamento - Atividades"
                          value={viewingItem.licensingData.activities?.map((a) =>
                            `${a.codeGroup}/${a.subItem}${a.enterpriseSize ? ` · ${a.enterpriseSize}${a.sizeUnit || 'ha'}` : ''}${a.autoPorte ? ` · Porte ${a.autoPorte}` : ''}${a.autoPotencial ? ` · Potencial ${a.autoPotencial}` : ''}${a.description ? ` - ${a.description}` : ''}`,
                          ) || ['Não informado']}
                        />
                        <DetailItem
                          label="Licenciamento - Classe sugerida"
                          value={String(viewingItem.licensingData.grading.classeSugerida)}
                        />
                        <DetailItem
                          label="Licenciamento - Modalidade sugerida"
                          value={viewingItem.licensingData.grading.modalidadeSugerida}
                        />
                        <DetailItem
                          label="Licenciamento - Documentos marcados"
                          value={String(viewingItem.licensingData.documents.filter((d) => d.checked).length)}
                        />
                        <DetailItem
                          label="Licenciamento - Critério locacional"
                          value={formatCriterioLocacionalLabel(
                            viewingItem.licensingData.grading.criterioLocacional,
                          )}
                        />
                        {viewingItem.licensingData.criterioLocacionalManual ? (
                          <DetailItem
                            label="Critério locacional"
                            value="Travado manualmente (não sobrescreve ao reanalisar)"
                          />
                        ) : null}
                        {viewingItem.licensingData.locationalAnalysis ? (
                          <>
                            <DetailItem
                              label="Análise locacional — modo de entrada"
                              value={locationalInputModeLabel(
                                viewingItem.licensingData.locationalAnalysis.inputMode,
                              )}
                            />
                            <DetailItem
                              label="Análise locacional — pré-visualização"
                              value={viewingItem.licensingData.locationalAnalysis.inputPreview}
                            />
                            <DetailItem
                              label="Análise locacional — sugestão automática"
                              value={formatCriterioLocacionalLabel(
                                viewingItem.licensingData.locationalAnalysis.suggestedCriterio,
                              )}
                            />
                            <DetailItem
                              label="Análise locacional — motivos"
                              value={
                                viewingItem.licensingData.locationalAnalysis.reasons?.length
                                  ? viewingItem.licensingData.locationalAnalysis.reasons
                                  : ['Nenhum motivo registado']
                              }
                            />
                            <DetailItem
                              label="Análise locacional — data"
                              value={formatTramiteDate(viewingItem.licensingData.locationalAnalysis.analyzedAt)}
                            />
                          </>
                        ) : null}
                      </>
                    )}
                    {viewingItem.services.includes(INTERVENTION_SERVICE_LABEL) && (
                      <DetailItem
                        label="Progresso do checklist de intervenção"
                        value={getChecklistProgress(viewingItem) || '0/0'}
                      />
                    )}
                    {viewingItem.services.includes(INTERVENTION_SERVICE_LABEL) && (
                      <DetailItem
                        label="Pendências obrigatórias"
                        value={String(getRequiredPendingCount(viewingItem))}
                      />
                    )}
                    {viewingItem.services.includes(INTERVENTION_SERVICE_LABEL) &&
                      viewingItem.interventionChecklist &&
                      viewingItem.interventionChecklist.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Resumo dos status do checklist</Label>
                          <div className="flex flex-wrap gap-2">
                            {(
                              [
                                'not_started',
                                'collecting',
                                'not_applicable',
                                'completed',
                              ] as InterventionChecklistItem['status'][]
                            ).map((statusKey) => {
                              const counters = getStatusBreakdown(viewingItem);
                              if (counters[statusKey] === 0) return null;
                              return (
                                <Badge
                                  key={statusKey}
                                  variant="outline"
                                  className={cn(getChecklistStatusBadgeClass(statusKey))}
                                >
                                  {getChecklistStatusLabel(statusKey)}: {counters[statusKey]}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    <Separator />
                    <DetailItem label="Status" value={getStatusLabel(viewingItem.status)} />
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Linha do tempo</Label>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_FLOW.map((s) => {
                          const currentIdx = STATUS_FLOW.indexOf(viewingItem.status);
                          const idx = STATUS_FLOW.indexOf(s);
                          const done = idx <= currentIdx;
                          return (
                            <Badge key={s} variant={done ? 'default' : 'outline'}>
                              {getStatusLabel(s)}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                    <DetailItem label="Data de Criação" value={formatTramiteDate(viewingItem.createdAt)} />
                </div>
            )}
            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
                {viewingItem ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="gap-1"
                      onClick={() => handleExportPdf(viewingItem)}
                    >
                      <FileText className="h-4 w-4" />
                      Exportar PDF
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="gap-1"
                      onClick={() => handleShareEmail(viewingItem)}
                    >
                      <Mail className="h-4 w-4" />
                      E-mail
                    </Button>
                  </div>
                ) : null}
                <DialogClose asChild>
                    <Button type="button" variant="outline">
                    Fechar
                    </Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá excluir permanentemente a solicitação de trâmite.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
