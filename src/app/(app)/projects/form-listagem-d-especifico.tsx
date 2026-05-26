'use client';

import { FormListagemDModulo4 } from './form-listagem-d-modulo4';
import { FormListagemDModulo5 } from './form-listagem-d-modulo5';

export function FormListagemDEspecifico({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <FormListagemDModulo4 form={form} />
      <FormListagemDModulo5 form={form} />
    </div>
  );
}
