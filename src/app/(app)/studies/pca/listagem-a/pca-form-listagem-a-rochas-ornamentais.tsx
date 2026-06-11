'use client';

import type { UseFormReturn } from 'react-hook-form';
import { PcaFormListagemAModulo2 } from './pca-form-listagem-a-modulo2';
import { PcaFormListagemARochasComplemento } from './pca-form-listagem-a-rochas-complemento';
import { PcaFormListagemARochasTecnico } from './pca-form-listagem-a-rochas-tecnico';
import {
  PcaSectionCard,
  PcaTextAreaField,
} from './pca-form-listagem-a-helpers';

export function PcaFormListagemARochasOrnamentais({
  form,
}: {
  form: UseFormReturn<any>;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
        Ficha PCA — <strong>Lavra de rochas ornamentais</strong> (ardósias, mármores, granitos e
        quartzitos). Dados em <code className="text-xs">listagemA.rochasOrnamentais.*</code>, com
        prefill a partir do cadastro do empreendimento.
      </div>

      <PcaSectionCard title="Módulo 2 — Regularização ambiental">
        <PcaFormListagemAModulo2 form={form} />
      </PcaSectionCard>

      <PcaFormListagemARochasComplemento form={form} />
      <PcaFormListagemARochasTecnico form={form} />

      <PcaSectionCard title="Módulo 3 — Medidas de controle (PCA)">
        <PcaTextAreaField
          form={form}
          name="conteudoEstudo.analiseImpactos"
          label="Análise de impactos"
        />
        <PcaTextAreaField
          form={form}
          name="conteudoEstudo.programasAmbientais"
          label="Programas ambientais específicos"
        />
        <PcaTextAreaField
          form={form}
          name="conteudoEstudo.medidasMitigadoras"
          label="Medidas mitigadoras"
        />
        <PcaTextAreaField
          form={form}
          name="conteudoEstudo.anexos"
          label="Anexos (referência / observações)"
        />
      </PcaSectionCard>
    </div>
  );
}
