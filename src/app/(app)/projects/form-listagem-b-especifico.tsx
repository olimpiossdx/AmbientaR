'use client';

import { FormListagemBProcessos } from './form-listagem-b-processos';
import { FormListagemBAmbiental } from './form-listagem-b-ambiental';

interface FormListagemBEspecificoProps {
  form: any;
}

export function FormListagemBEspecifico({ form }: FormListagemBEspecificoProps) {
  return (
    <div className="space-y-6">
      <FormListagemBProcessos form={form} />
      <FormListagemBAmbiental form={form} />
    </div>
  );
}
