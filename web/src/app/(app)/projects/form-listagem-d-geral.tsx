'use client';

import { FormListagemGeralBase } from './form-listagem-geral-base';
import {
  inferirFormularioListagemD,
  LISTAGEM_D_ACTIVITY_BY_TIPO,
  LISTAGEM_D_FORM_TIPO_PADRAO,
} from './listagem-d-form-registry';

export function FormListagemDGeral({ form }: { form: any }) {
  return (
    <FormListagemGeralBase
      form={form}
      letter="D"
      dataPrefix="listagemD"
      title="Listagem D – formulário geral"
      description="Para atividades da Listagem D sem ficha RCA de aguardente de cana."
      inferirFormulario={inferirFormularioListagemD}
      activityByTipo={LISTAGEM_D_ACTIVITY_BY_TIPO}
      defaultTipo={LISTAGEM_D_FORM_TIPO_PADRAO}
    />
  );
}
