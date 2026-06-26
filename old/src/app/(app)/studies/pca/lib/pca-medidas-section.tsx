'use client';

import type { UseFormReturn } from 'react-hook-form';
import { PcaSectionCard, PcaTextAreaField } from './pca-form-helpers';

/** Bloco comum de medidas / conteúdo PCA (impactos, programas, mitigação). */
export function PcaMedidasSection({ form }: { form: UseFormReturn<any> }) {
  return (
    <PcaSectionCard title="Medidas de controle (PCA)">
      <PcaTextAreaField form={form} name="conteudoEstudo.analiseImpactos" label="Análise de impactos" />
      <PcaTextAreaField
        form={form}
        name="conteudoEstudo.programasAmbientais"
        label="Programas ambientais específicos"
      />
      <PcaTextAreaField form={form} name="conteudoEstudo.medidasMitigadoras" label="Medidas mitigadoras" />
      <PcaTextAreaField form={form} name="conteudoEstudo.anexos" label="Anexos (referência / observações)" />
    </PcaSectionCard>
  );
}
