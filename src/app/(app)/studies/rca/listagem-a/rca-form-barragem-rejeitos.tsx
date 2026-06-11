'use client';

import type { Empreendedor as Client, Project } from '@/lib/types';
import type { UseFormReturn } from 'react-hook-form';
import {
  RcaBooleanRadio,
  RcaSectionCard,
  RcaTextAreaField,
  RcaTextField,
} from './rca-form-listagem-a-helpers';
import { RcaFormLavraSubterranea } from './rca-form-lavra-subterranea';

type RcaFormBarragemRejeitosProps = {
  form: UseFormReturn<any>;
  clients: Client[];
  isLoadingClients: boolean;
  projects: Project[];
  isLoadingProjects: boolean;
};

export function RcaFormBarragemRejeitos(props: RcaFormBarragemRejeitosProps) {
  const { form } = props;

  return (
    <div className="space-y-4">
      <RcaSectionCard
        title="Caracterização da barragem de rejeitos (Listagem A)"
        description="Campos específicos para barragem de rejeitos e resíduos — complementam os módulos 1–7 do RCA minerário."
      >
        <RcaBooleanRadio
          form={form}
          name="listagemA.barragemRejeitos.haBarragem"
          label="Há barragem de rejeitos/resíduos no empreendimento?"
        />
        <RcaTextField
          form={form}
          name="listagemA.barragemRejeitos.identificacao"
          label="Identificação da barragem"
        />
        <RcaTextField form={form} name="listagemA.barragemRejeitos.tipo" label="Tipo de barragem" />
        <RcaTextField
          form={form}
          name="listagemA.barragemRejeitos.classificacaoRisco"
          label="Classificação de risco"
        />
        <RcaTextField
          form={form}
          name="listagemA.barragemRejeitos.situacaoLicenciamento"
          label="Situação de licenciamento"
        />
        <RcaTextField
          form={form}
          name="listagemA.barragemRejeitos.processoAnm"
          label="Processo ANM / DNPM"
        />
        <RcaTextAreaField
          form={form}
          name="listagemA.barragemRejeitos.planoAcaoEmergencial"
          label="Plano de ação de emergência"
        />
      </RcaSectionCard>
      <RcaFormLavraSubterranea {...props} />
    </div>
  );
}
