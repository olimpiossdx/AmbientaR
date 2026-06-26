'use client';

import { FormListagemGeralBase } from './form-listagem-geral-base';
import {
  inferirFormularioListagemA,
  LISTAGEM_A_ACTIVITY_BY_TIPO,
  LISTAGEM_A_FORM_TIPO_PADRAO,
} from './listagem-a-form-registry';

export function FormListagemAGeral({ form }: { form: any }) {
  return (
    <FormListagemGeralBase
      form={form}
      letter="A"
      dataPrefix="listagemA"
      title="Listagem A – formulário geral"
      description="Use quando a atividade não possuir ficha RCA específica cadastrada no sistema."
      inferirFormulario={inferirFormularioListagemA}
      activityByTipo={LISTAGEM_A_ACTIVITY_BY_TIPO}
      defaultTipo={LISTAGEM_A_FORM_TIPO_PADRAO}
    />
  );
}
