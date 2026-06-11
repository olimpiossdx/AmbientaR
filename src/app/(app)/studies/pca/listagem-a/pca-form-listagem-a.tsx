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
import { PCA_LISTAGEM_A_ACTIVITY } from '@/lib/pca/pca-listagem-a-catalog';
import {
  PCA_LISTAGEM_A_FORM_TIPO_PADRAO,
  type PcaListagemAFormTipo,
} from './pca-listagem-a-registry';
import {
  getPcaListagemADefaultValues,
  pcaListagemAFormSchema,
  type PcaListagemAFormValues,
} from './pca-listagem-a-schema';
import { PcaFormListagemAShell } from './pca-form-listagem-a-shell';
import { PcaListagemAFormularioTipoCard } from './pca-form-listagem-a-tipo-card';
import { PcaFormListagemAGeral } from './pca-form-listagem-a-geral';
import { PcaFormListagemALavraSubterranea } from './pca-form-listagem-a-lavra-subterranea';
import { PcaFormListagemARochasOrnamentais } from './pca-form-listagem-a-rochas-ornamentais';
import { PcaFormListagemAExtracaoAreiaCascalho } from './pca-form-listagem-a-extracao-areia-cascalho';
import { PcaFormListagemABarragemRejeitos } from './pca-form-listagem-a-barragem-rejeitos';
import {
  prefillPcaListagemAFromProject,
  serializePcaListagemAForFirestore,
  shouldPrefillFromProject,
} from './pca-project-prefill';
import { normalizarFormularioTipoPcaListagemA } from './pca-listagem-a-registry';

interface PcaFormListagemAProps {
  currentItem?: PCA | null;
  onSuccess?: () => void;
}

function mapCurrentItemToFormValues(currentItem: PCA): PcaListagemAFormValues {
  const extended = currentItem as PCA & Partial<PcaListagemAFormValues>;
  return getPcaListagemADefaultValues({
    ...extended,
    listagemCode: 'A',
    activity: extended.activity || PCA_LISTAGEM_A_ACTIVITY,
    subActivity: extended.subActivity ?? '',
    formularioTipo: normalizarFormularioTipoPcaListagemA(extended.formularioTipo),
    termoReferencia: {
      ...currentItem.termoReferencia,
      dataEmissao: new Date(currentItem.termoReferencia.dataEmissao),
    },
    listagemA: extended.listagemA ?? {},
  });
}

export function PcaFormListagemA({ currentItem, onSuccess }: PcaFormListagemAProps) {
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

  const form = useForm<PcaListagemAFormValues>({
    resolver: zodResolver(pcaListagemAFormSchema),
    defaultValues: currentItem
      ? mapCurrentItemToFormValues(currentItem)
      : getPcaListagemADefaultValues({
          activity: PCA_LISTAGEM_A_ACTIVITY,
        }),
  });

  const formularioTipo = form.watch('formularioTipo') ?? PCA_LISTAGEM_A_FORM_TIPO_PADRAO;
  const selectedClientId = form.watch('empreendedor.clientId');
  const selectedProjectId = form.watch('empreendimento.projectId');

  const setFormularioTipo = React.useCallback(
    (tipo: PcaListagemAFormTipo) => {
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
    const patch = prefillPcaListagemAFromProject(project, empreendedor);
    if (patch.subActivity) form.setValue('subActivity', patch.subActivity);
    if (patch.formularioTipo) form.setValue('formularioTipo', patch.formularioTipo);
    if (patch.empreendimento) {
      form.setValue('empreendimento', {
        ...form.getValues('empreendimento'),
        ...patch.empreendimento,
      });
    }
    if (patch.listagemA) {
      form.setValue('listagemA', { ...form.getValues('listagemA'), ...patch.listagemA });
    }
    if (patch.conservationUnit) {
      form.setValue('conservationUnit' as never, patch.conservationUnit as never);
    }
    if (patch.legalReserve) {
      form.setValue('legalReserve' as never, patch.legalReserve as never);
    }
    if (patch.locationalRestrictions) {
      form.setValue('locationalRestrictions' as never, patch.locationalRestrictions as never);
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

    const dataToSave = serializePcaListagemAForFirestore(values, status);

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
          description: `PCA Listagem A para ${values.empreendimento.nome} criado.`,
        });
        form.reset(getPcaListagemADefaultValues({ activity: PCA_LISTAGEM_A_ACTIVITY }));
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
            <Badge variant="secondary">Listagem A</Badge>
            <Badge variant="outline">PCA – atividades minerárias</Badge>
            {isApproved && (
              <Badge variant="default">Aprovado — snapshot congelado</Badge>
            )}
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

          <PcaListagemAFormularioTipoCard
            form={form}
            currentTipo={formularioTipo}
            onTipoChange={setFormularioTipo}
          />

          <PcaFormListagemAShell
            form={form}
            clients={clients ?? []}
            projects={projects ?? []}
            isLoadingClients={isLoadingClients}
            isLoadingProjects={isLoadingProjects}
            readOnlyEmpreendimento={isApproved}
          />

          {formularioTipo === 'geral' && <PcaFormListagemAGeral form={form} />}
          {formularioTipo === 'lavra_subterranea' && (
            <PcaFormListagemALavraSubterranea form={form} />
          )}
          {formularioTipo === 'rochas_ornamentais' && (
            <PcaFormListagemARochasOrnamentais form={form} />
          )}
          {formularioTipo === 'extracao_areia_cascalho' && (
            <PcaFormListagemAExtracaoAreiaCascalho form={form} />
          )}
          {formularioTipo === 'barragem_rejeitos' && (
            <PcaFormListagemABarragemRejeitos form={form} />
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
