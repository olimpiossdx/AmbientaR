'use client';

import * as React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { Empreendedor, Project } from '@/lib/types';
import {
  prefillEmpreendedorFieldsFromClient,
  prefillRcaListagemAFromProject,
  shouldPrefillFromProject,
} from './rca-project-prefill';

type UseRcaListagemAPrefillOptions = {
  form: UseFormReturn<any>;
  clients?: Empreendedor[] | null;
  projects?: Project[] | null;
  currentStatus?: string;
  hasSnapshot?: boolean;
};

/** Prefill centralizado de empreendedor/empreendimento para RCA Listagem A. */
export function useRcaListagemAPrefill({
  form,
  clients,
  projects,
  currentStatus,
  hasSnapshot,
}: UseRcaListagemAPrefillOptions) {
  const selectedClientId = form.watch('empreendedor.clientId') as string | undefined;
  const selectedProjectId = form.watch('empreendimento.projectId') as string | undefined;

  React.useEffect(() => {
    if (!shouldPrefillFromProject(currentStatus, hasSnapshot)) return;
    if (!selectedClientId || !clients?.length) return;
    const client = clients.find((c) => c.id === selectedClientId);
    if (!client) return;
    const patch = prefillEmpreendedorFieldsFromClient(client);
    form.setValue('empreendedor', {
      ...form.getValues('empreendedor'),
      ...patch,
    });
  }, [selectedClientId, clients, form, currentStatus, hasSnapshot]);

  React.useEffect(() => {
    if (!shouldPrefillFromProject(currentStatus, hasSnapshot)) return;
    if (!selectedProjectId || !projects?.length) return;
    const project = projects.find((p) => p.id === selectedProjectId);
    if (!project) return;
    const empreendedor = clients?.find((c) => c.id === selectedClientId);
    const patch = prefillRcaListagemAFromProject(project, empreendedor);
    if (patch.subActivity) form.setValue('subActivity', patch.subActivity);
    if (patch.formularioTipo) form.setValue('formularioTipo', patch.formularioTipo);
    if (patch.empreendimento) {
      form.setValue('empreendimento', {
        ...form.getValues('empreendimento'),
        ...patch.empreendimento,
      });
    }
    if (patch.empreendedor) {
      form.setValue('empreendedor', {
        ...form.getValues('empreendedor'),
        ...patch.empreendedor,
      });
    }
    if (patch.listagemA) {
      form.setValue('listagemA', { ...form.getValues('listagemA'), ...patch.listagemA });
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
    currentStatus,
    hasSnapshot,
  ]);
}
