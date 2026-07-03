'use client';

import type { UseFormReturn } from 'react-hook-form';
import { StudyEmpreendedorProjectFields } from '@/components/studies/study-empreendedor-project-fields';

type PcaListagemShellEntityFieldsProps = {
  form: UseFormReturn<any>;
  readOnlyEmpreendimento?: boolean;
};

export function PcaListagemShellEmpreendedorField({
  form,
  readOnlyEmpreendimento,
}: PcaListagemShellEntityFieldsProps) {
  return (
    <StudyEmpreendedorProjectFields
      form={form}
      empreendedorName="empreendedor.clientId"
      showProject={false}
      disabled={readOnlyEmpreendimento}
      empreendedorLabel="Empreendedor cadastrado"
    />
  );
}

export function PcaListagemShellProjectField({
  form,
  readOnlyEmpreendimento,
}: PcaListagemShellEntityFieldsProps) {
  return (
    <StudyEmpreendedorProjectFields
      form={form}
      empreendedorName="empreendedor.clientId"
      showEmpreendedor={false}
      disabled={readOnlyEmpreendimento}
      projectLabel="Empreendimento cadastrado"
    />
  );
}
