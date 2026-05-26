'use client';

import { FormListagemBPrincipal } from './form-listagem-b-principal';
import { FormListagemBGeral } from './form-listagem-b-geral';
import { ListagemFormularioTipoCard } from './listagem-formulario-tipo-card';
import { useListagemFormularioTipo } from './use-listagem-formulario-tipo';
import {
  LISTAGEM_B_FORM_TIPOS,
  LISTAGEM_B_FORM_CONFIG,
  type ListagemBFormTipo,
} from './listagem-b-form-registry';

export function FormListagemB({ form }: { form: any }) {
  const { tipo, fieldPath, setFormularioTipo } = useListagemFormularioTipo(form, LISTAGEM_B_FORM_CONFIG);

  return (
    <div className="space-y-6">
      <ListagemFormularioTipoCard<ListagemBFormTipo>
        form={form}
        letter="B"
        fieldPath={fieldPath}
        formTipos={LISTAGEM_B_FORM_TIPOS}
        defaultTipo={LISTAGEM_B_FORM_CONFIG.defaultTipo}
        currentTipo={tipo}
        onTipoChange={setFormularioTipo}
        description="Indústrias com formulário completo usam a ficha principal. Outras atividades da Listagem B usam o formulário geral."
      />
      {tipo === 'geral' ? <FormListagemBGeral form={form} /> : <FormListagemBPrincipal form={form} />}
    </div>
  );
}
