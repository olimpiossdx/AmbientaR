'use client';

import { FormListagemGeralBase } from './form-listagem-geral-base';
import {
  inferirFormularioListagemC,
  LISTAGEM_C_ACTIVITY_BY_TIPO,
  LISTAGEM_C_FORM_TIPO_PADRAO,
} from './listagem-c-form-registry';

export function FormListagemCGeral({ form }: { form: any }) {
  return (
    <FormListagemGeralBase
      form={form}
      letter="C"
      dataPrefix="listagemC"
      title="Listagem C – formulário geral"
      description="Use quando a atividade não possuir ficha RCA específica cadastrada no sistema."
      inferirFormulario={inferirFormularioListagemC}
      activityByTipo={LISTAGEM_C_ACTIVITY_BY_TIPO}
      defaultTipo={LISTAGEM_C_FORM_TIPO_PADRAO}
    />
  );
}
