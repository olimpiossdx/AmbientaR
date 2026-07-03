'use client';

import { FormDescription } from '@/components/ui/form';
import { SectionCard } from './form-listagem-a-helpers';

/** Placeholder até existir anexo RCA específico da Listagem H. */
export function FormListagemHPrincipal({ form }: { form: any }) {
  void form;
  return (
    <SectionCard title="Formulário específico – Listagem H">
      <FormDescription>
        Fichas RCA específicas por atividade da Listagem H serão adicionadas gradualmente. Use o formulário geral para
        licenciamento de outras atividades.
      </FormDescription>
    </SectionCard>
  );
}
