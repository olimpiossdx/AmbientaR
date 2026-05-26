'use client';

import { FormDescription } from '@/components/ui/form';
import { SectionCard } from './form-listagem-a-helpers';

/** Placeholder até existir anexo RCA específico da Listagem G. */
export function FormListagemGPrincipal({ form }: { form: any }) {
  void form;
  return (
    <SectionCard title="Formulário específico – Listagem G">
      <FormDescription>
        O anexo RCA detalhado para agrossilvipastoris será disponibilizado em versão futura. Enquanto isso, use o
        formulário geral ou preencha os dados gerais do empreendimento nas outras abas.
      </FormDescription>
    </SectionCard>
  );
}
