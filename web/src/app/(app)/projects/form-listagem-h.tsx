'use client';

import { FormListagemHPrincipal } from './form-listagem-h-principal';
import { FormListagemHGeral } from './form-listagem-h-geral';
import { ListagemFormularioTipoCard } from './listagem-formulario-tipo-card';
import { useListagemFormularioTipo } from './use-listagem-formulario-tipo';
import {
  LISTAGEM_H_FORM_TIPOS,
  LISTAGEM_H_FORM_CONFIG,
  type ListagemHFormTipo,
} from './listagem-h-form-registry';

export function FormListagemH({ form }: { form: any }) {
  const { tipo, fieldPath, setFormularioTipo } = useListagemFormularioTipo(form, LISTAGEM_H_FORM_CONFIG);

  return (
    <div className="space-y-6">
      <ListagemFormularioTipoCard<ListagemHFormTipo>
        form={form}
        letter="H"
        fieldPath={fieldPath}
        formTipos={LISTAGEM_H_FORM_TIPOS}
        defaultTipo={LISTAGEM_H_FORM_CONFIG.defaultTipo}
        currentTipo={tipo}
        onTipoChange={setFormularioTipo}
        description="Outras atividades ambientais. Use o formulário geral até existir ficha RCA específica para a atividade."
      />
      {tipo === 'geral' ? <FormListagemHGeral form={form} /> : <FormListagemHPrincipal form={form} />}
    </div>
  );
}
