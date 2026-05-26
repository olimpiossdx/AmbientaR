'use client';

import { FormListagemAPrincipal } from './form-listagem-a-principal';
import { FormListagemAGeral } from './form-listagem-a-geral';
import { ListagemFormularioTipoCard } from './listagem-formulario-tipo-card';
import { useListagemFormularioTipo } from './use-listagem-formulario-tipo';
import {
  LISTAGEM_A_FORM_TIPOS,
  LISTAGEM_A_FORM_CONFIG,
  type ListagemAFormTipo,
} from './listagem-a-form-registry';

export function FormListagemA({ form }: { form: any }) {
  const { tipo, fieldPath, setFormularioTipo } = useListagemFormularioTipo(form, LISTAGEM_A_FORM_CONFIG);

  return (
    <div className="space-y-6">
      <ListagemFormularioTipoCard<ListagemAFormTipo>
        form={form}
        letter="A"
        fieldPath={fieldPath}
        formTipos={LISTAGEM_A_FORM_TIPOS}
        defaultTipo={LISTAGEM_A_FORM_CONFIG.defaultTipo}
        currentTipo={tipo}
        onTipoChange={setFormularioTipo}
        description="Atividades minerárias com formulário completo usam a ficha principal. Demais atividades da Listagem A usam o formulário geral até haver anexo específico."
      />
      {tipo === 'geral' ? <FormListagemAGeral form={form} /> : <FormListagemAPrincipal form={form} />}
    </div>
  );
}
