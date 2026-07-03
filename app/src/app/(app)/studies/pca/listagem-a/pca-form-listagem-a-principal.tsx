'use client';

import type { UseFormReturn } from 'react-hook-form';
import {
  PcaBooleanRadio,
  PcaSectionCard,
  PcaTextAreaField,
  PcaTextField,
} from './pca-form-listagem-a-helpers';
import type { PcaListagemAFormValues } from './pca-listagem-a-schema';

export function PcaFormListagemAPrincipal({ form }: { form: UseFormReturn<PcaListagemAFormValues> }) {
  return (
    <div className="space-y-4">
      <PcaSectionCard title="Regularização ambiental">
        <div className="grid gap-4 md:grid-cols-2">
          <PcaTextField form={form} name="listagemA.regularizacaoAmbiental.fase" label="Fase" />
          <PcaTextField form={form} name="listagemA.regularizacaoAmbiental.classe" label="Classe" />
        </div>
        <PcaTextField
          form={form}
          name="listagemA.regularizacaoAmbiental.processoUltimaLicenca"
          label="Processo da última licença"
        />
      </PcaSectionCard>

      <PcaSectionCard title="Atividades minerárias">
        <PcaTextField
          form={form}
          name="listagemA.atividadesPrincipal.0.atividade"
          label="Atividade principal"
        />
        <PcaTextField
          form={form}
          name="listagemA.atividadesPrincipal.0.codigo"
          label="Código DN-217/2017"
        />
        <PcaTextField
          form={form}
          name="listagemA.atividadesPrincipal.0.quantidade"
          label="Quantidade / parâmetro"
        />
      </PcaSectionCard>

      <PcaSectionCard title="Recursos hídricos e energia">
        <PcaTextAreaField
          form={form}
          name="listagemA.recursosHidricos.resumoIntervencoes"
          label="Intervenções em recursos hídricos"
        />
        <PcaBooleanRadio
          form={form}
          name="listagemA.energetico.utilizaEnergia"
          label="Utiliza geração / consumo de energia?"
        />
        <PcaTextField form={form} name="listagemA.energetico.resumo" label="Resumo energético" />
      </PcaSectionCard>

      <PcaSectionCard title="Conteúdo complementar do PCA">
        <PcaTextAreaField
          form={form}
          name="conteudoEstudo.analiseImpactos"
          label="Análise de impactos"
        />
        <PcaTextAreaField
          form={form}
          name="conteudoEstudo.medidasMitigadoras"
          label="Medidas mitigadoras"
        />
        <PcaTextAreaField form={form} name="conteudoEstudo.referencias" label="Referências" />
        <PcaTextAreaField form={form} name="conteudoEstudo.anexos" label="Anexos" />
      </PcaSectionCard>
    </div>
  );
}
