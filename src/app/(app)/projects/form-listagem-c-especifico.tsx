'use client';

import { FormListagemCTecnico } from './form-listagem-c-tecnico';

interface FormListagemCEspecificoProps {
  form: any;
}

export function FormListagemCEspecifico({ form }: FormListagemCEspecificoProps) {
  return (
    <div className="space-y-6">
      <FormListagemCTecnico form={form} />
    </div>
  );
}
