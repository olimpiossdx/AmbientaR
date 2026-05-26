'use client';

import { FormListagemCPrincipal } from './form-listagem-c-principal';
import { FormListagemCGeral } from './form-listagem-c-geral';
import { ListagemFormularioTipoCard } from './listagem-formulario-tipo-card';
import { useListagemFormularioTipo } from './use-listagem-formulario-tipo';
import {
  LISTAGEM_C_FORM_TIPOS,
  LISTAGEM_C_FORM_CONFIG,
  type ListagemCFormTipo,
} from './listagem-c-form-registry';

export function FormListagemC({ form }: { form: any }) {
  const { tipo, fieldPath, setFormularioTipo } = useListagemFormularioTipo(form, LISTAGEM_C_FORM_CONFIG);

  return (
    <div className="space-y-6">
      <ListagemFormularioTipoCard<ListagemCFormTipo>
        form={form}
        letter="C"
        fieldPath={fieldPath}
        formTipos={LISTAGEM_C_FORM_TIPOS}
        defaultTipo={LISTAGEM_C_FORM_CONFIG.defaultTipo}
        currentTipo={tipo}
        onTipoChange={setFormularioTipo}
        description="Indústria de borracha usa a ficha principal. Demais atividades da Listagem C usam o formulário geral."
      />
      {tipo === 'geral' ? <FormListagemCGeral form={form} /> : <FormListagemCPrincipal form={form} />}
    </div>
  );
}
