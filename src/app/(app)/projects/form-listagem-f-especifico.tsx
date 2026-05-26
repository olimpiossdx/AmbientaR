'use client';

import { FormListagemFModulo3 } from './form-listagem-f-modulo3';
import { FormListagemFModulo4 } from './form-listagem-f-modulo4';
import { FormListagemFModulo5 } from './form-listagem-f-modulo5';
import { FormListagemFModulo6 } from './form-listagem-f-modulo6';

export function FormListagemFEspecifico({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <FormListagemFModulo3 form={form} />
      <FormListagemFModulo4 form={form} />
      <FormListagemFModulo5 form={form} />
      <FormListagemFModulo6 form={form} />
    </div>
  );
}
