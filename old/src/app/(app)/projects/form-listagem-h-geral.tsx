'use client';

import { FormListagemGeralBase } from './form-listagem-geral-base';
import {
  inferirFormularioListagemH,
  LISTAGEM_H_ACTIVITY_BY_TIPO,
  LISTAGEM_H_FORM_TIPO_PADRAO,
} from './listagem-h-form-registry';

export function FormListagemHGeral({ form }: { form: any }) {
  return (
    <FormListagemGeralBase
      form={form}
      letter="H"
      dataPrefix="listagemH"
      title="Listagem H – formulário geral"
      description="Para atividades da Listagem H sem ficha RCA específica cadastrada."
      inferirFormulario={inferirFormularioListagemH}
      activityByTipo={LISTAGEM_H_ACTIVITY_BY_TIPO}
      defaultTipo={LISTAGEM_H_FORM_TIPO_PADRAO}
    />
  );
}
