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
import { PCA_LISTAGEM_G_ACTIVITY } from '@/lib/pca/pca-listagem-g-catalog';
import {
  PCA_LISTAGEM_G_FORM_TIPO_PADRAO,
  type PcaListagemGFormTipo} from './pca-listagem-g-registry';
import {
  getPcaListagemGDefaultValues,
  pcaListagemGFormSchema,
  type PcaListagemGFormValues} from './pca-listagem-g-schema';
import { PcaFormListagemGShell } from './pca-form-listagem-g-shell';
import { PcaListagemGFormularioTipoCard } from './pca-form-listagem-g-tipo-card';
import { PcaFormListagemGGeral } from './pca-form-listagem-g-geral';
import { PcaFormListagemGPrincipal } from './pca-form-listagem-g-principal';
import { PcaGeographicLocationSection } from '../lib/pca-geographic-location-section';
import {
  prefillPcaListagemGFromProject,
  serializePcaListagemGForFirestore,
  shouldPrefillFromProject} from './pca-project-prefill';

interface PcaFormListagemGProps {
  currentItem?: PCA | null;
  onSuccess?: () => void;
}

function mapCurrentItemToFormValues(currentItem: PCA): PcaListagemGFormValues {
  const extended = currentItem as PCA & Partial<PcaListagemGFormValues>;
  return getPcaListagemGDefaultValues({
    ...extended,
    listagemCode: 'G',
    activity: extended.activity || PCA_LISTAGEM_G_ACTIVITY,
    subActivity: extended.subActivity ?? '',
    formularioTipo: (extended.formularioTipo as PcaListagemGFormTipo) ?? PCA_LISTAGEM_G_FORM_TIPO_PADRAO,
    termoReferencia: {
      ...currentItem.termoReferencia,
      dataEmissao: new Date(currentItem.termoReferencia.dataEmissao)},
    listagemG: extended.listagemG ?? {}});
}

export function PcaFormListagemG({ currentItem, onSuccess }: PcaFormListagemGProps) {
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

  const form = useForm<PcaListagemGFormValues>({
    resolver: zodResolver(pcaListagemGFormSchema),
    defaultValues: currentItem
      ? mapCurrentItemToFormValues(currentItem)
      : getPcaListagemGDefaultValues({ activity: PCA_LISTAGEM_G_ACTIVITY })});

  const formularioTipo = form.watch('formularioTipo') ?? PCA_LISTAGEM_G_FORM_TIPO_PADRAO;
  const selectedClientId = form.watch('empreendedor.clientId');
  const selectedProjectId = form.watch('empreendimento.projectId');

  const setFormularioTipo = React.useCallback(
    (tipo: PcaListagemGFormTipo) => {
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
    const patch = prefillPcaListagemGFromProject(project, empreendedor);
    if (patch.subActivity) form.setValue('subActivity', patch.subActivity);
    if (patch.formularioTipo) form.setValue('formularioTipo', patch.formularioTipo);
    if (patch.empreendimento) {
      form.setValue('empreendimento', {
        ...form.getValues('empreendimento'),
        ...patch.empreendimento});
    }
    if (patch.listagemG) {
      form.setValue('listagemG', { ...form.getValues('listagemG'), ...patch.listagemG });
    }
    if (patch.geographicLocation) {
      form.setValue('geographicLocation', patch.geographicLocation as never);
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

    const dataToSave = serializePcaListagemGForFirestore(values, status);

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
          description: `PCA Listagem G para ${values.empreendimento.nome} criado.`});
        form.reset(getPcaListagemGDefaultValues({ activity: PCA_LISTAGEM_G_ACTIVITY }));
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
            <Badge variant="secondary">Listagem G</Badge>
            <Badge variant="outline">PCA – agrossilvipastoris</Badge>
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

          <PcaListagemGFormularioTipoCard
            form={form}
            currentTipo={formularioTipo}
            onTipoChange={setFormularioTipo}
          />

          <PcaFormListagemGShell
            form={form}
            clients={clients ?? []}
            projects={projects ?? []}
            isLoadingClients={isLoadingClients}
            isLoadingProjects={isLoadingProjects}
            readOnlyEmpreendimento={isApproved}
          />

          <PcaGeographicLocationSection form={form} />

          {formularioTipo === 'geral' && <PcaFormListagemGGeral form={form} />}
          {formularioTipo === 'principal' && <PcaFormListagemGPrincipal form={form} />}
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
