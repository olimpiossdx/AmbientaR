'use client';

import { FormListagemGeralBase } from './form-listagem-geral-base';
import {
  inferirFormularioListagemB,
  LISTAGEM_B_ACTIVITY_BY_TIPO,
  LISTAGEM_B_FORM_TIPO_PADRAO,
} from './listagem-b-form-registry';

export function FormListagemBGeral({ form }: { form: any }) {
  return (
    <FormListagemGeralBase
      form={form}
      letter="B"
      dataPrefix="listagemB"
      title="Listagem B – formulário geral"
      description="Use quando a atividade não possuir ficha RCA específica cadastrada no sistema."
      inferirFormulario={inferirFormularioListagemB}
      activityByTipo={LISTAGEM_B_ACTIVITY_BY_TIPO}
      defaultTipo={LISTAGEM_B_FORM_TIPO_PADRAO}
    />
  );
}
