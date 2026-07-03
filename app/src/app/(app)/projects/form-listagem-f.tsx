'use client';

import { FormListagemFPostoCombustivel } from './form-listagem-f-comum';
import { FormListagemFGeral } from './form-listagem-f-geral';
import { ListagemFormularioTipoCard } from './listagem-formulario-tipo-card';
import { useListagemFormularioTipo } from './use-listagem-formulario-tipo';
import {
  LISTAGEM_F_FORM_TIPOS,
  LISTAGEM_F_FORM_CONFIG,
  type ListagemFFormTipo,
} from './listagem-f-form-registry';

export function FormListagemF({ form }: { form: any }) {
  const { tipo, fieldPath, setFormularioTipo } = useListagemFormularioTipo(form, LISTAGEM_F_FORM_CONFIG);

  return (
    <div className="space-y-6">
      <ListagemFormularioTipoCard<ListagemFFormTipo>
        form={form}
        letter="F"
        fieldPath={fieldPath}
        formTipos={LISTAGEM_F_FORM_TIPOS}
        defaultTipo={LISTAGEM_F_FORM_CONFIG.defaultTipo}
        currentTipo={tipo}
        onTipoChange={setFormularioTipo}
        description="Código F-06-01-7 (posto revendedor) usa o RCA completo. Outras atividades da Listagem F usam o formulário geral."
      />
      {tipo === 'geral' ? <FormListagemFGeral form={form} /> : <FormListagemFPostoCombustivel form={form} />}
    </div>
  );
}
