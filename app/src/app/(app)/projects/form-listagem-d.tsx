'use client';

import { FormListagemDAguardente } from './form-listagem-d-aguardente';
import { FormListagemDGeral } from './form-listagem-d-geral';
import { ListagemFormularioTipoCard } from './listagem-formulario-tipo-card';
import { useListagemFormularioTipo } from './use-listagem-formulario-tipo';
import {
  LISTAGEM_D_FORM_TIPOS,
  LISTAGEM_D_FORM_CONFIG,
  type ListagemDFormTipo,
} from './listagem-d-form-registry';

export function FormListagemD({ form }: { form: any }) {
  const { tipo, fieldPath, setFormularioTipo } = useListagemFormularioTipo(form, LISTAGEM_D_FORM_CONFIG);

  return (
    <div className="space-y-6">
      <ListagemFormularioTipoCard<ListagemDFormTipo>
        form={form}
        letter="D"
        fieldPath={fieldPath}
        formTipos={LISTAGEM_D_FORM_TIPOS}
        defaultTipo={LISTAGEM_D_FORM_CONFIG.defaultTipo}
        currentTipo={tipo}
        onTipoChange={setFormularioTipo}
        description="Código D-02-02-1 (aguardente de cana) usa o RCA completo. Outras atividades da Listagem D usam o formulário geral."
      />
      {tipo === 'geral' ? <FormListagemDGeral form={form} /> : <FormListagemDAguardente form={form} />}
    </div>
  );
}
