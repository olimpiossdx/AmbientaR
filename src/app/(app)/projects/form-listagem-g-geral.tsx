'use client';

import { FormListagemGeralBase } from './form-listagem-geral-base';
import {
  inferirFormularioListagemG,
  LISTAGEM_G_ACTIVITY_BY_TIPO,
  LISTAGEM_G_FORM_TIPO_PADRAO,
} from './listagem-g-form-registry';

export function FormListagemGGeral({ form }: { form: any }) {
  return (
    <FormListagemGeralBase
      form={form}
      letter="G"
      dataPrefix="listagemG"
      title="Listagem G – formulário geral"
      description="Para atividades agrossilvipastoris e demais da Listagem G sem anexo específico no sistema."
      inferirFormulario={inferirFormularioListagemG}
      activityByTipo={LISTAGEM_G_ACTIVITY_BY_TIPO}
      defaultTipo={LISTAGEM_G_FORM_TIPO_PADRAO}
    />
  );
}
