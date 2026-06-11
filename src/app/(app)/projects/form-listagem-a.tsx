'use client';

import { FormListagemAPrincipal } from './form-listagem-a-principal';
import { FormListagemALavraSubterranea } from './form-listagem-a-lavra-subterranea';
import { FormListagemARochasOrnamentais } from './form-listagem-a-rochas-ornamentais';
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
        description="Lavra subterrânea (A-01-01-*) e rochas ornamentais (A-02-06-2 e correlatos) têm fichas específicas. Demais atividades minerárias usam o formulário principal ou o geral."
      />
      {tipo === 'geral' ? (
        <FormListagemAGeral form={form} />
      ) : tipo === 'lavra_subterranea' ? (
        <FormListagemALavraSubterranea form={form} />
      ) : tipo === 'rochas_ornamentais' ? (
        <FormListagemARochasOrnamentais form={form} />
      ) : (
        <FormListagemAPrincipal form={form} />
      )}
    </div>
  );
}
