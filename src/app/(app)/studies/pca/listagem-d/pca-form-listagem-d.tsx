'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PCA, Empreendedor, Project } from '@/lib/types';
import { useFirebase, errorEmitter, useCollection, useMemoFirebase } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { PCA_LISTAGEM_D_ACTIVITY } from '@/lib/pca/pca-listagem-d-catalog';
import {
  PCA_LISTAGEM_D_FORM_TIPO_PADRAO,
  type PcaListagemDFormTipo,
} from './pca-listagem-d-registry';
import {
  getPcaListagemDDefaultValues,
  pcaListagemDFormSchema,
  type PcaListagemDFormValues,
} from './pca-listagem-d-schema';
import { PcaFormListagemDShell } from './pca-form-listagem-d-shell';
import { PcaListagemDFormularioTipoCard } from './pca-form-listagem-d-tipo-card';
import { PcaFormListagemDGeral } from './pca-form-listagem-d-geral';
import { PcaFormListagemDAguardenteCana } from './pca-form-listagem-d-aguardenete-cana';
import {
  prefillPcaListagemDFromProject,
  serializePcaListagemDForFirestore,
  shouldPrefillFromProject,
} from './pca-project-prefill';

interface PcaFormListagemDProps {
  currentItem?: PCA | null;
  onSuccess?: () => void;
}

function mapCurrentItemToFormValues(currentItem: PCA): PcaListagemDFormValues {
  const extended = currentItem as PCA & Partial<PcaListagemDFormValues>;
  return getPcaListagemDDefaultValues({
    ...extended,
    listagemCode: 'D',
    activity: extended.activity || PCA_LISTAGEM_D_ACTIVITY,
    subActivity: extended.subActivity ?? '',
    formularioTipo: (extended.formularioTipo as PcaListagemDFormTipo) ?? PCA_LISTAGEM_D_FORM_TIPO_PADRAO,
    termoReferencia: {
      ...currentItem.termoReferencia,
      dataEmissao: new Date(currentItem.termoReferencia.dataEmissao),
    },
    listagemD: extended.listagemD ?? {},
  });
}

export function PcaFormListagemD({ currentItem, onSuccess }: PcaFormListagemDProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'empreendedores') : null),
    [firestore],
  );
  const { data: clients, isLoading: isLoadingClients } = useCollection<Empreendedor>(empreendedoresQuery);
  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'projects') : null),
    [firestore],
  );
  const { data: projects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);

  const isApproved = currentItem?.status === 'Aprovado';
  const hasSnapshot = Boolean((currentItem as PCA & { projectSnapshot?: unknown })?.projectSnapshot);

  const form = useForm<PcaListagemDFormValues>({
    resolver: zodResolver(pcaListagemDFormSchema),
    defaultValues: currentItem
      ? mapCurrentItemToFormValues(currentItem)
      : getPcaListagemDDefaultValues({ activity: PCA_LISTAGEM_D_ACTIVITY }),
  });

  const formularioTipo = form.watch('formularioTipo') ?? PCA_LISTAGEM_D_FORM_TIPO_PADRAO;
  const selectedClientId = form.watch('empreendedor.clientId');
  const selectedProjectId = form.watch('empreendimento.projectId');

  const setFormularioTipo = React.useCallback(
    (tipo: PcaListagemDFormTipo) => {
      form.setValue('formularioTipo', tipo, { shouldDirty: true });
    },
    [form],
  );

  React.useEffect(() => {
    if (!shouldPrefillFromProject(currentItem?.status, hasSnapshot)) return;
    if (!selectedClientId || !clients?.length) return;
    const client = clients.find((c) => c.id === selectedClientId);
    if (!client) return;
    form.setValue('empreendedor.nome', client.name ?? '');
    form.setValue('empreendedor.cpfCnpj', client.cpfCnpj ?? '');
    form.setValue('empreendedor.endereco', client.address ?? '');
    form.setValue('empreendedor.contato', [client.phone, client.email].filter(Boolean).join(' / '));
  }, [selectedClientId, clients, form, currentItem?.status, hasSnapshot]);

  React.useEffect(() => {
    if (!shouldPrefillFromProject(currentItem?.status, hasSnapshot)) return;
    if (!selectedProjectId || !projects?.length) return;
    const project = projects.find((p) => p.id === selectedProjectId);
    if (!project) return;
    const empreendedor = clients?.find((c) => c.id === selectedClientId);
    const patch = prefillPcaListagemDFromProject(project, empreendedor);
    if (patch.subActivity) form.setValue('subActivity', patch.subActivity);
    if (patch.formularioTipo) form.setValue('formularioTipo', patch.formularioTipo);
    if (patch.empreendimento) {
      form.setValue('empreendimento', {
        ...form.getValues('empreendimento'),
        ...patch.empreendimento,
      });
    }
    if (patch.listagemD) {
      form.setValue('listagemD', { ...form.getValues('listagemD'), ...patch.listagemD });
    }
  }, [selectedProjectId, projects, clients, selectedClientId, form, currentItem?.status, hasSnapshot]);

  async function handleSave(status: 'Rascunho' | 'Aprovado') {
    setLoading(true);
    const isValid = await form.trigger();
    if (!isValid && status === 'Aprovado') {
      toast({
        variant: 'destructive',
        title: 'Formulário inválido',
        description: 'Corrija os erros antes de aprovar.',
      });
      setLoading(false);
      return;
    }

    const values = form.getValues();
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }

    const dataToSave = serializePcaListagemDForFirestore(values, status);

    try {
      if (currentItem?.id) {
        const docRef = doc(firestore, 'pcas', currentItem.id);
        await updateDoc(docRef, dataToSave);
        toast({
          title: 'PCA atualizado',
          description: `Documento salvo como ${status.toLowerCase()}.`,
        });
      } else {
        await addDoc(collection(firestore, 'pcas'), dataToSave);
        toast({
          title: 'PCA criado',
          description: `PCA Listagem D para ${values.empreendimento.nome} criado.`,
        });
        form.reset(getPcaListagemDDefaultValues({ activity: PCA_LISTAGEM_D_ACTIVITY }));
      }
      if (status === 'Aprovado') onSuccess?.();
    } catch {
      const path = currentItem?.id ? `pcas/${currentItem.id}` : 'pcas';
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path,
          operation: currentItem?.id ? 'update' : 'create',
          requestResourceData: dataToSave,
        }),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="flex h-full flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto pr-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Listagem D</Badge>
            <Badge variant="outline">PCA – indústria alimentícia</Badge>
            {isApproved && <Badge variant="default">Aprovado — snapshot congelado</Badge>}
          </div>

          {isApproved && hasSnapshot && (
            <Alert>
              <AlertTitle>Documento aprovado</AlertTitle>
              <AlertDescription>
                Os dados técnicos foram congelados na aprovação. Alterações no empreendimento não
                alteram este PCA.
              </AlertDescription>
            </Alert>
          )}

          <PcaListagemDFormularioTipoCard
            form={form}
            currentTipo={formularioTipo}
            onTipoChange={setFormularioTipo}
          />

          <PcaFormListagemDShell
            form={form}
            clients={clients ?? []}
            projects={projects ?? []}
            isLoadingClients={isLoadingClients}
            isLoadingProjects={isLoadingProjects}
            readOnlyEmpreendimento={isApproved}
          />

          {formularioTipo === 'geral' && <PcaFormListagemDGeral form={form} />}
          {formularioTipo === 'aguardenete_cana' && (
            <PcaFormListagemDAguardenteCana form={form} />
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSave('Rascunho')}
            disabled={loading || isApproved}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando…
              </>
            ) : (
              'Salvar rascunho'
            )}
          </Button>
          <Button type="button" onClick={() => handleSave('Aprovado')} disabled={loading || isApproved}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Concluindo…
              </>
            ) : (
              'Concluir e aprovar'
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
