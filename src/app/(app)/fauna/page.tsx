
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, PlusCircle, Paperclip } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { FaunaStudy, Empreendedor } from '@/lib/types';
import { usePortalEmpreendedorIds } from '@/hooks/use-portal-empreendedor-ids';
import { getFaunaStudyLabel } from '@/lib/fauna-study-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { FaunaUploadForm } from './fauna-upload-form';
import { RecordViewDialog } from '@/components/shared/record-view-dialog';

export default function FaunaManagementPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const portalEmpreendedorIds = usePortalEmpreendedorIds();

  const approvedStudiesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'faunaStudies'), where('status', '==', 'completed'));
  }, [firestore, user]);

  const { data: studiesRaw, isLoading: isLoadingStudies } = useCollection<FaunaStudy>(approvedStudiesQuery);

  const studies = React.useMemo(() => {
    if (!studiesRaw) return undefined;
    if (portalEmpreendedorIds === undefined) return undefined;
    if (portalEmpreendedorIds.length === 0) return studiesRaw;
    if (portalEmpreendedorIds[0] === 'invalid-placeholder') return [];
    return studiesRaw.filter((s) =>
      portalEmpreendedorIds.includes(s.empreendedorId),
    );
  }, [studiesRaw, portalEmpreendedorIds]);

  const empreendedoresQuery = useMemoFirebase(() => firestore ? collection(firestore, 'empreendedores') : null, [firestore]);
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } = useCollection<Empreendedor>(empreendedoresQuery);

  const empreendedorMap = React.useMemo(() => {
    if (!empreendedores) return new Map();
    return new Map(empreendedores.map(e => [e.id, e.name]));
  }, [empreendedores]);

  const isLoading =
    isLoadingStudies ||
    isLoadingEmpreendedores ||
    portalEmpreendedorIds === undefined;
  const getSortDateValue = (value: unknown) => {
    if (!value) return Number.POSITIVE_INFINITY;
    if (typeof value === "string") {
      const parsed = new Date(value).getTime();
      return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
    }
    if (
      typeof value === "object" &&
      value !== null &&
      "toDate" in value &&
      typeof (value as { toDate?: unknown }).toDate === "function"
    ) {
      const date = (value as { toDate: () => Date }).toDate();
      const parsed = date.getTime();
      return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
    }
    return Number.POSITIVE_INFINITY;
  };
  const sortedStudies = React.useMemo(
    () =>
      [...(studies || [])].sort(
        (a, b) =>
          getSortDateValue(a.createdAt) - getSortDateValue(b.createdAt),
      ),
    [studies],
  );
  const formatCreatedAt = (value: unknown) => {
    const timestamp = getSortDateValue(value);
    if (!Number.isFinite(timestamp)) return "N/A";
    return new Date(timestamp).toLocaleDateString("pt-BR", { timeZone: "UTC" });
  };

  const handleExport = (format: 'pdf' | 'docx') => {
      toast({ title: "Funcionalidade em desenvolvimento" });
  }

  const getStatusVariant = (status?: 'draft' | 'completed') => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30';
      default: return 'bg-slate-500/20 text-slate-700 border-slate-500/30';
    }
  };
  
  const getStatusLabel = (status?: 'draft' | 'completed') => {
    switch (status) {
        case 'completed': return 'Concluído';
        default: return 'Não definido';
    }
  }

  const getStudyOrDocumentName = (study: FaunaStudy) => getFaunaStudyLabel(study);

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Fauna — Documentos Ambientais">
           <Button size="sm" className="gap-1" onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="h-4 w-4" />
            Adicionar Documento Externo
          </Button>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios e Licenças Concluídas</CardTitle>
              <CardDescription>
                Documentos concluídos pela consultoria e arquivos enviados pelo cliente. Estudos em elaboração ficam em Elaboração de Estudos → Estudos de Fauna.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="space-y-3 md:hidden">
                  {isLoading && Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4 space-y-2">
                        <Skeleton className="h-5 w-44" />
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-4 w-24" />
                      </CardContent>
                    </Card>
                  ))}
                  {!isLoading && sortedStudies?.map((study) => (
                    <Card key={study.id} className="rounded-xl border-border/70 shadow-sm">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {empreendedorMap.get(study.empreendedorId) || 'Não definido'}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {getStudyOrDocumentName(study)}
                            </p>
                          </div>
                          <Badge variant={'outline'} className={cn(getStatusVariant(study.status))}>
                            {getStatusLabel(study.status)}
                          </Badge>
                        </div>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Data:</span> {formatCreatedAt(study.createdAt)}
                        </p>
                        <div className="flex items-center gap-1">
                          <RecordViewDialog
                            title="Documento de fauna"
                            description="Visualização sem edição."
                            fileUrl={study.fileUrl}
                            labels={{
                              attachmentEmpty: 'Sem arquivo PDF.',
                              zoomTitle: 'Anexo de fauna',
                            }}
                            triggerLabel="Visualizar documento"
                            contentClassName="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto"
                          >
                            <div>
                              <p className="text-muted-foreground text-xs">Empreendedor</p>
                              <p className="font-medium">{empreendedorMap.get(study.empreendedorId) || '—'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Documento</p>
                              <p className="font-medium">{getStudyOrDocumentName(study)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Data</p>
                              <p className="font-medium">{formatCreatedAt(study.createdAt)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground text-xs">Status</span>
                              <Badge variant={'outline'} className={cn(getStatusVariant(study.status))}>
                                {getStatusLabel(study.status)}
                              </Badge>
                            </div>
                          </RecordViewDialog>
                          {study.fileUrl ? (
                            <Button asChild variant="ghost" size="icon">
                              <a href={study.fileUrl} target="_blank" rel="noopener noreferrer" aria-label="Ver anexo">
                                <Paperclip className="h-4 w-4" />
                              </a>
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon" onClick={() => handleExport('pdf')}>
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {!isLoading && sortedStudies?.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
                      Nenhum estudo concluído encontrado.
                    </div>
                  )}
                </div>
                <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empreendedor</TableHead>
                      <TableHead>Tipo de Documento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))}
                    {!isLoading && sortedStudies?.map((study) => (
                      <TableRow key={study.id}>
                        <TableCell className="font-medium">{empreendedorMap.get(study.empreendedorId) || 'Não definido'}</TableCell>
                        <TableCell>{getStudyOrDocumentName(study)}</TableCell>
                        <TableCell className="hidden lg:table-cell">{formatCreatedAt(study.createdAt)}</TableCell>
                        <TableCell>
                          <Badge variant={'outline'} className={cn(getStatusVariant(study.status))}>
                            {getStatusLabel(study.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <RecordViewDialog
                              title="Documento de fauna"
                              description="Visualização sem edição."
                              fileUrl={study.fileUrl}
                              labels={{
                                attachmentEmpty: 'Sem arquivo PDF.',
                                zoomTitle: 'Anexo de fauna',
                              }}
                              triggerLabel="Visualizar documento"
                              contentClassName="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto"
                            >
                              <div>
                                <p className="text-muted-foreground text-xs">Empreendedor</p>
                                <p className="font-medium">{empreendedorMap.get(study.empreendedorId) || '—'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Documento</p>
                                <p className="font-medium">{getStudyOrDocumentName(study)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Data</p>
                                <p className="font-medium">{formatCreatedAt(study.createdAt)}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-xs">Status</span>
                                <Badge variant={'outline'} className={cn(getStatusVariant(study.status))}>
                                  {getStatusLabel(study.status)}
                                </Badge>
                              </div>
                            </RecordViewDialog>
                            {study.fileUrl ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button asChild variant="ghost" size="icon">
                                            <a href={study.fileUrl} target="_blank" rel="noopener noreferrer" aria-label="Ver anexo">
                                            <Paperclip className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Ver anexo</p></TooltipContent>
                                </Tooltip>
                            ) : (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => handleExport('pdf')}>
                                        <FileText className="h-4 w-4" />
                                    </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Gerar PDF</p></TooltipContent>
                                </Tooltip>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!isLoading && sortedStudies?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">Nenhum estudo concluído encontrado.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-xl">
          <FaunaUploadForm onSuccess={() => {
            setIsFormOpen(false);
            toast({ title: "Documento adicionado com sucesso" });
          }}/>
        </DialogContent>
      </Dialog>
    </>
  );
}
