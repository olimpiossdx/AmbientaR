'use client';

import { FormListagemGPrincipal } from './form-listagem-g-principal';
import { FormListagemGGeral } from './form-listagem-g-geral';
import { ListagemFormularioTipoCard } from './listagem-formulario-tipo-card';
import { useListagemFormularioTipo } from './use-listagem-formulario-tipo';
import {
  LISTAGEM_G_FORM_TIPOS,
  LISTAGEM_G_FORM_CONFIG,
  type ListagemGFormTipo,
} from './listagem-g-form-registry';

export function FormListagemG({ form }: { form: any }) {
  const { tipo, fieldPath, setFormularioTipo } = useListagemFormularioTipo(form, LISTAGEM_G_FORM_CONFIG);

  return (
    <div className="space-y-6">
      <ListagemFormularioTipoCard<ListagemGFormTipo>
        form={form}
        letter="G"
        fieldPath={fieldPath}
        formTipos={LISTAGEM_G_FORM_TIPOS}
        defaultTipo={LISTAGEM_G_FORM_CONFIG.defaultTipo}
        currentTipo={tipo}
        onTipoChange={setFormularioTipo}
        description="Agrossilvipastoris e atividades correlatas. Use o formulário geral quando não houver ficha específica cadastrada."
      />
      {tipo === 'geral' ? <FormListagemGGeral form={form} /> : <FormListagemGPrincipal form={form} />}
    </div>
  );
}
