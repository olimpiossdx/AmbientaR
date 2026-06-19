'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { RCA, Empreendedor, Project } from '@/lib/types';
import { useFirebase, errorEmitter, useCollection, useMemoFirebase } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { RCA_LISTAGEM_G_ACTIVITY } from '@/lib/rca/rca-listagem-g-catalog';
import {
  RCA_LISTAGEM_G_FORM_TIPO_PADRAO,
  inferirFormularioRcaListagemG,
  normalizarFormularioTipoRcaListagemG,
  subatividadeParaFormularioRcaListagemG,
  type RcaListagemGFormTipo,
} from './rca-listagem-g-registry';
import {
  getRcaListagemGDefaultValues,
  rcaListagemGFormSchema,
  type RcaListagemGFormValues,
} from './rca-listagem-g-schema';
import { RcaListagemGFormularioTipoCard } from './rca-form-listagem-g-tipo-card';
import {
  RcaFormCulturasListagemG,
  RcaFormBovinocultura,
  RcaFormIrrigados,
  RcaFormSilvicultura,
  RcaFormGraos,
  RcaFormSuinocultura,
  RcaFormAvicultura,
} from './rca-form-listagem-g-activity';
import {
  prefillRcaListagemGFromProject,
  serializeRcaListagemGForFirestore,
} from './rca-project-prefill';
import { shouldPrefillFromProject } from '../listagem-a/rca-project-prefill';
import { getRcaListagemGInitialValues } from '../lib/rca-form-initial-values';
import { RcaGeographicLocationSection } from '../lib/rca-geographic-location-section';

interface RcaFormListagemGProps {
  currentItem?: RCA | null;
  onSuccess?: () => void;
}

function mapCurrentItemToFormValues(currentItem: RCA): RcaListagemGFormValues {
  const extended = currentItem as RCA & Partial<RcaListagemGFormValues>;
  const formularioTipo = normalizarFormularioTipoRcaListagemG(
    extended.formularioTipo ?? inferirFormularioRcaListagemG(extended.subActivity),
  );
  return getRcaListagemGDefaultValues({
    ...getRcaListagemGInitialValues(currentItem),
    ...extended,
    listagemCode: 'G',
    activity: extended.activity || RCA_LISTAGEM_G_ACTIVITY,
    subActivity:
      extended.subActivity?.trim() ||
      subatividadeParaFormularioRcaListagemG(formularioTipo),
    formularioTipo,
    termoReferencia: currentItem.termoReferencia
      ? {
          titulo: currentItem.termoReferencia.titulo ?? '',
          processo: currentItem.termoReferencia.processo ?? '',
          versao: currentItem.termoReferencia.versao ?? '',
          dataEmissao: new Date(
            currentItem.termoReferencia.dataEmissao as string | number | Date,
          ),
        }
      : undefined,
    listagemG: extended.listagemG ?? {},
  });
}

export function RcaFormListagemG({ currentItem, onSuccess }: RcaFormListagemGProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const router = useRouter();

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'empreendedores') : null),
    [firestore],
  );
  const { data: clients, isLoading: isLoadingClients } =
    useCollection<Empreendedor>(empreendedoresQuery);
  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'projects') : null),
    [firestore],
  );
  const { data: projects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);

  const isApproved = currentItem?.status === 'Aprovado';
  const hasSnapshot = Boolean(
    (currentItem as RCA & { projectSnapshot?: unknown })?.projectSnapshot,
  );

  const form = useForm<any>({
    resolver: zodResolver(rcaListagemGFormSchema),
    defaultValues: currentItem
      ? mapCurrentItemToFormValues(currentItem)
      : getRcaListagemGDefaultValues({ activity: RCA_LISTAGEM_G_ACTIVITY }),
  });

  const formularioTipo =
    form.watch('formularioTipo') ?? RCA_LISTAGEM_G_FORM_TIPO_PADRAO;
  const selectedClientId = form.watch('empreendedor.clientId') as string | undefined;
  const selectedProjectId = form.watch('empreendimento.projectId') as string | undefined;

  const setFormularioTipo = React.useCallback(
    (tipo: RcaListagemGFormTipo) => {
      form.setValue('formularioTipo', tipo, { shouldDirty: true });
      form.setValue('subActivity', subatividadeParaFormularioRcaListagemG(tipo), {
        shouldDirty: true,
      });
    },
    [form],
  );

  React.useEffect(() => {
    if (!shouldPrefillFromProject(currentItem?.status, hasSnapshot)) return;
    if (formularioTipo === 'culturas') return;
    if (!selectedClientId || !clients?.length) return;
    const client = clients.find((c) => c.id === selectedClientId);
    if (!client) return;
    form.setValue('empreendedor.nome', client.name ?? '');
    form.setValue('empreendedor.cpfCnpj', client.cpfCnpj ?? '');
    form.setValue('empreendedor.endereco', client.address ?? '');
    form.setValue('empreendedor.email', client.email ?? '');
    form.setValue('empreendedor.fone', client.phone ?? '');
  }, [selectedClientId, clients, form, currentItem?.status, hasSnapshot, formularioTipo]);

  React.useEffect(() => {
    if (!shouldPrefillFromProject(currentItem?.status, hasSnapshot)) return;
    if (formularioTipo === 'culturas') return;
    if (!selectedProjectId || !projects?.length) return;
    const project = projects.find((p) => p.id === selectedProjectId);
    if (!project) return;
    const empreendedor = clients?.find((c) => c.id === selectedClientId);
    const patch = prefillRcaListagemGFromProject(project, empreendedor);
    if (patch.subActivity) form.setValue('subActivity', patch.subActivity);
    if (patch.formularioTipo) form.setValue('formularioTipo', patch.formularioTipo);
    if (patch.empreendimento) {
      form.setValue('empreendimento', {
        ...form.getValues('empreendimento'),
        ...patch.empreendimento,
      });
    }
    if (patch.listagemG) {
      form.setValue('listagemG', { ...form.getValues('listagemG'), ...patch.listagemG });
    }
    if (patch.geographicLocation) {
      form.setValue('geographicLocation', patch.geographicLocation as never);
    }
    if (patch.restricoesLocacionais) {
      form.setValue('restricoesLocacionais', patch.restricoesLocacionais as never);
    }
    if (patch.unidadesConservacao) {
      form.setValue('unidadesConservacao', patch.unidadesConservacao as never);
    }
  }, [
    selectedProjectId,
    projects,
    clients,
    selectedClientId,
    form,
    currentItem?.status,
    hasSnapshot,
    formularioTipo,
  ]);

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

    const values = form.getValues() as RcaListagemGFormValues;
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }

    const dataToSave = serializeRcaListagemGForFirestore(values, status);

    try {
      if (currentItem?.id) {
        const docRef = doc(firestore, 'rcas', currentItem.id);
        await updateDoc(docRef, dataToSave);
        toast({
          title: 'RCA atualizado',
          description: `Documento salvo como ${status.toLowerCase()}.`,
        });
      } else {
        await addDoc(collection(firestore, 'rcas'), dataToSave);
        toast({
          title: 'RCA criado',
          description: `RCA Listagem G para ${(values.empreendimento as { nome?: string })?.nome ?? 'empreendimento'} criado.`,
        });
      }
      if (status === 'Aprovado') onSuccess?.();
    } catch {
      const path = currentItem?.id ? `rcas/${currentItem.id}` : 'rcas';
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

  const formProps = {
    form,
    clients: clients ?? [],
    isLoadingClients,
    projects: projects ?? [],
    isLoadingProjects,
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex h-full flex-col overflow-hidden"
      >
        <div className="flex-1 space-y-4 overflow-y-auto pr-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Listagem G</Badge>
            <Badge variant="outline">RCA – agrossilvipastoris</Badge>
            {isApproved && <Badge variant="default">Aprovado — snapshot congelado</Badge>}
          </div>

          {isApproved && hasSnapshot && (
            <Alert>
              <AlertTitle>Documento aprovado</AlertTitle>
              <AlertDescription>
                Os dados técnicos foram congelados na aprovação. Alterações no empreendimento não
                alteram este RCA.
              </AlertDescription>
            </Alert>
          )}

          <RcaListagemGFormularioTipoCard
            form={form}
            currentTipo={formularioTipo}
            onTipoChange={setFormularioTipo}
          />

          <RcaGeographicLocationSection form={form} />

          {formularioTipo === 'culturas' && <RcaFormCulturasListagemG {...formProps} />}
          {formularioTipo === 'bovinocultura' && <RcaFormBovinocultura {...formProps} />}
          {formularioTipo === 'irrigados' && <RcaFormIrrigados {...formProps} />}
          {formularioTipo === 'silvicultura' && <RcaFormSilvicultura {...formProps} />}
          {formularioTipo === 'graos' && <RcaFormGraos {...formProps} />}
          {formularioTipo === 'suinocultura' && <RcaFormSuinocultura {...formProps} />}
          {formularioTipo === 'avicultura' && <RcaFormAvicultura {...formProps} />}
        </div>

        <div className="mt-4 flex items-center justify-between border-t pt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex gap-2">
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
            <Button
              type="button"
              onClick={() => handleSave('Aprovado')}
              disabled={loading || isApproved}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Concluindo…
                </>
              ) : (
                'Concluir e aprovar'
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
