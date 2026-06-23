'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PCA, Empreendedor, Project } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { handleFirestoreFormError } from '@/lib/firestore-form-errors';

import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { PCA_LISTAGEM_B_ACTIVITY } from '@/lib/pca/pca-listagem-b-catalog';
import {
  PCA_LISTAGEM_B_FORM_TIPO_PADRAO,
  type PcaListagemBFormTipo} from './pca-listagem-b-registry';
import {
  getPcaListagemBDefaultValues,
  pcaListagemBFormSchema,
  type PcaListagemBFormValues} from './pca-listagem-b-schema';
import { PcaFormListagemBShell } from './pca-form-listagem-b-shell';
import { PcaListagemBFormularioTipoCard } from './pca-form-listagem-b-tipo-card';
import { PcaFormListagemBGeral } from './pca-form-listagem-b-geral';
import { PcaFormListagemBPrincipal } from './pca-form-listagem-b-principal';
import { PcaFormListagemBFerroligas } from './pca-form-listagem-b-ferroligas';
import { PcaFormListagemBFundidosFerroAco } from './pca-form-listagem-b-fundidos-ferro-aco';
import { PcaFormListagemBNaoFerrosos } from './pca-form-listagem-b-nao-ferrosos';
import {
  prefillPcaListagemBFromProject,
  serializePcaListagemBForFirestore,
  shouldPrefillFromProject} from './pca-project-prefill';

interface PcaFormListagemBProps {
  currentItem?: PCA | null;
  onSuccess?: () => void;
}

function mapCurrentItemToFormValues(currentItem: PCA): PcaListagemBFormValues {
  const extended = currentItem as PCA & Partial<PcaListagemBFormValues>;
  return getPcaListagemBDefaultValues({
    ...extended,
    listagemCode: 'B',
    activity: extended.activity || PCA_LISTAGEM_B_ACTIVITY,
    subActivity: extended.subActivity ?? '',
    formularioTipo: (extended.formularioTipo as PcaListagemBFormTipo) ?? PCA_LISTAGEM_B_FORM_TIPO_PADRAO,
    termoReferencia: {
      ...currentItem.termoReferencia,
      dataEmissao: new Date(currentItem.termoReferencia.dataEmissao)},
    listagemB: extended.listagemB ?? {}});
}

export function PcaFormListagemB({ currentItem, onSuccess }: PcaFormListagemBProps) {
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

  const form = useForm<PcaListagemBFormValues>({
    resolver: zodResolver(pcaListagemBFormSchema),
    defaultValues: currentItem
      ? mapCurrentItemToFormValues(currentItem)
      : getPcaListagemBDefaultValues({ activity: PCA_LISTAGEM_B_ACTIVITY })});

  const formularioTipo = form.watch('formularioTipo') ?? PCA_LISTAGEM_B_FORM_TIPO_PADRAO;
  const selectedClientId = form.watch('empreendedor.clientId');
  const selectedProjectId = form.watch('empreendimento.projectId');

  const setFormularioTipo = React.useCallback(
    (tipo: PcaListagemBFormTipo) => {
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
    const patch = prefillPcaListagemBFromProject(project, empreendedor);
    if (patch.subActivity) form.setValue('subActivity', patch.subActivity);
    if (patch.formularioTipo) form.setValue('formularioTipo', patch.formularioTipo);
    if (patch.empreendimento) {
      form.setValue('empreendimento', {
        ...form.getValues('empreendimento'),
        ...patch.empreendimento});
    }
    if (patch.listagemB) {
      form.setValue('listagemB', { ...form.getValues('listagemB'), ...patch.listagemB });
    }
  }, [selectedProjectId, projects, clients, selectedClientId, form, currentItem?.status, hasSnapshot]);

  async function handleSave(status: 'Rascunho' | 'Aprovado') {
    setLoading(true);
    const isValid = await form.trigger();
    if (!isValid && status === 'Aprovado') {
      toast({
        variant: 'destructive',
        title: 'Formulário inválido',
        description: 'Corrija os erros antes de aprovar.'});
      setLoading(false);
      return;
    }

    const values = form.getValues();
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }

    const dataToSave = serializePcaListagemBForFirestore(values, status);

    try {
      if (currentItem?.id) {
        const docRef = doc(firestore, 'pcas', currentItem.id);
        await updateDoc(docRef, dataToSave);
        toast({
          title: 'PCA atualizado',
          description: `Documento salvo como ${status.toLowerCase()}.`});
      } else {
        await addDoc(collection(firestore, 'pcas'), dataToSave);
        toast({
          title: 'PCA criado',
          description: `PCA Listagem B para ${values.empreendimento.nome} criado.`});
        form.reset(getPcaListagemBDefaultValues({ activity: PCA_LISTAGEM_B_ACTIVITY }));
      }
      if (status === 'Aprovado') onSuccess?.();
    } catch (error) {
      const path = currentItem?.id ? `pcas/${currentItem.id}` : 'pcas';
      handleFirestoreFormError(error, {
        toast,
        title: 'Erro ao salvar PCA',
        context: {
          path,
          operation: currentItem?.id ? 'update' : 'create',
          requestResourceData: dataToSave}});
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="flex h-full flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto pr-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Listagem B</Badge>
            <Badge variant="outline">PCA – indústria metalúrgica e afins</Badge>
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

          <PcaListagemBFormularioTipoCard
            form={form}
            currentTipo={formularioTipo}
            onTipoChange={setFormularioTipo}
          />

          <PcaFormListagemBShell
            form={form}
            clients={clients ?? []}
            projects={projects ?? []}
            isLoadingClients={isLoadingClients}
            isLoadingProjects={isLoadingProjects}
            readOnlyEmpreendimento={isApproved}
          />

          {formularioTipo === 'geral' && <PcaFormListagemBGeral form={form} />}
          {formularioTipo === 'principal' && <PcaFormListagemBPrincipal form={form} />}
          {formularioTipo === 'ferroligas' && <PcaFormListagemBFerroligas form={form} />}
          {formularioTipo === 'fundidos_ferro_aco' && (
            <PcaFormListagemBFundidosFerroAco form={form} />
          )}
          {formularioTipo === 'fundidos_nao_ferrosos' && (
            <PcaFormListagemBNaoFerrosos form={form} />
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
