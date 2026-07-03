'use client';

import { FormListagemCTecnico } from './form-listagem-c-tecnico';
import { FormListagemCImpactos } from './form-listagem-c-impactos';

interface FormListagemCEspecificoProps {
  form: any;
}

export function FormListagemCEspecifico({ form }: FormListagemCEspecificoProps) {
  return (
    <div className="space-y-6">
      <FormListagemCTecnico form={form} />
      <FormListagemCImpactos form={form} />
    </div>
  );
}
