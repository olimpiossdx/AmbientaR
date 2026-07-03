'use client';

import type { ReactNode } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import {
  PcaSectionCard,
  PcaTextAreaField,
} from './pca-form-listagem-a-helpers';
import { PcaFormListagemAModulo2 } from './pca-form-listagem-a-modulo2';
import { PcaFormListagemATecnicoSecoes } from './pca-form-listagem-a-tecnico-secoes';

export function PcaFormListagemAFichaMinerariaCompleta({
  form,
  titulo,
  descricao,
  extra,
  tecnicoParte = 'completo',
}: {
  form: UseFormReturn<any>;
  titulo: string;
  descricao: string;
  extra?: ReactNode;
  tecnicoParte?: 'completo' | '27-36' | '37-53' | '57-59';
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
        <strong>{titulo}</strong> — {descricao}
      </div>

      <PcaSectionCard title="Módulo 2 — Regularização ambiental">
        <PcaFormListagemAModulo2 form={form} />
      </PcaSectionCard>

      {extra}

      <PcaSectionCard title="Módulo 3 — Detalhamento técnico">
        <PcaFormListagemATecnicoSecoes form={form} parte={tecnicoParte} />
      </PcaSectionCard>

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
