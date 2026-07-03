'use client';

import type { UseFormReturn } from 'react-hook-form';
import {
  PcaBooleanRadio,
  PcaSectionCard,
  PcaTextAreaField,
  PcaTextField,
} from './pca-form-listagem-a-helpers';
import { PcaFormListagemAFichaMinerariaCompleta } from './pca-form-listagem-a-ficha-completa';

/** Ficha PCA — barragem de rejeitos e resíduos. */
export function PcaFormListagemABarragemRejeitos({
  form,
}: {
  form: UseFormReturn<any>;
}) {
  return (
    <PcaFormListagemAFichaMinerariaCompleta
      form={form}
      titulo="Barragem de rejeitos e resíduos"
      descricao="Listagem A — TR PCA em termos de referencia/…/PCA/pca-barragem-de-rejeitos-e-residuos.doc. Inclui bloco técnico completo e caracterização da barragem."
      extra={
        <PcaSectionCard title="Caracterização da barragem de rejeitos">
          <PcaBooleanRadio
            form={form}
            name="listagemA.barragemDesmonte.haBarragem"
            label="Há barragem de rejeitos/resíduos no empreendimento?"
          />
          <PcaTextField
            form={form}
            name="listagemA.barragemDesmonte.identificacao"
            label="Identificação da barragem"
          />
          <PcaTextField form={form} name="listagemA.barragemDesmonte.tipo" label="Tipo de barragem" />
          <PcaTextField
            form={form}
            name="listagemA.barragemDesmonte.classificacaoRisco"
            label="Classificação de risco"
          />
          <PcaTextField
            form={form}
            name="listagemA.barragemDesmonte.situacaoLicenciamento"
            label="Situação de licenciamento"
          />
          <PcaTextField
            form={form}
            name="listagemA.barragemDesmonte.processoDnpm"
            label="Processo DNPM / ANM"
          />
          <PcaTextAreaField
            form={form}
            name="listagemA.barragemDesmonte.medidasControle"
            label="Medidas de controle e monitoramento"
          />
          <PcaTextAreaField
            form={form}
            name="listagemA.barragemDesmonte.observacoes"
            label="Observações complementares"
          />
        </PcaSectionCard>
      }
    />
  );
}
