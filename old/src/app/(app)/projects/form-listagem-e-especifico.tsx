'use client';

import { FormListagemEModulo3 } from './form-listagem-e-modulo3';
import { FormListagemEModulo4 } from './form-listagem-e-modulo4';

export function FormListagemEEspecifico({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <FormListagemEModulo3 form={form} />
      <FormListagemEModulo4 form={form} />
    </div>
  );
}
