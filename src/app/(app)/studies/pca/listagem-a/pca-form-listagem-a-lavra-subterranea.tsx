'use client';

import type { UseFormReturn } from 'react-hook-form';
import {
  PcaSectionCard,
  PcaTextAreaField,
} from './pca-form-listagem-a-helpers';
import { PcaFormListagemAModulo2 } from './pca-form-listagem-a-modulo2';
import { PcaFormListagemALavraComplemento } from './pca-form-listagem-a-lavra-complemento';
import { PcaFormListagemALavraTecnico } from './pca-form-listagem-a-lavra-tecnico';
import { PcaFormListagemATecnicoSecoes } from './pca-form-listagem-a-tecnico-secoes';
import type { PcaListagemAFormValues } from './pca-listagem-a-schema';

export function PcaFormListagemALavraSubterranea({
  form,
}: {
  form: UseFormReturn<any>;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
        Ficha PCA — <strong>Lavra subterrânea</strong> (Listagem A). Módulo 2: regularização
        ambiental; Módulo 3: detalhamento técnico e medidas de controle; dados pré-preenchidos a
        partir do cadastro do empreendimento quando disponível.
      </div>

      <PcaSectionCard title="Módulo 2 — Regularização ambiental">
        <PcaFormListagemAModulo2 form={form} />
      </PcaSectionCard>

      <PcaFormListagemALavraComplemento form={form} />

      <PcaSectionCard title="Módulo 3 — Detalhamento técnico (itens 27–36)">
        <PcaFormListagemATecnicoSecoes form={form} parte="27-36" />
      </PcaSectionCard>

      <PcaFormListagemALavraTecnico form={form} />

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
