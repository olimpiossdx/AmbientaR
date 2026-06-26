'use client';

import { FormListagemEDutosGasodutos } from './form-listagem-e-comum';
import { FormListagemEGeral } from './form-listagem-e-geral';
import { ListagemFormularioTipoCard } from './listagem-formulario-tipo-card';
import { useListagemFormularioTipo } from './use-listagem-formulario-tipo';
import {
  LISTAGEM_E_FORM_TIPOS,
  LISTAGEM_E_FORM_CONFIG,
  type ListagemEFormTipo,
} from './listagem-e-form-registry';

export function FormListagemE({ form }: { form: any }) {
  const { tipo, fieldPath, setFormularioTipo } = useListagemFormularioTipo(form, LISTAGEM_E_FORM_CONFIG);

  return (
    <div className="space-y-6">
      <ListagemFormularioTipoCard<ListagemEFormTipo>
        form={form}
        letter="E"
        fieldPath={fieldPath}
        formTipos={LISTAGEM_E_FORM_TIPOS}
        defaultTipo={LISTAGEM_E_FORM_CONFIG.defaultTipo}
        currentTipo={tipo}
        onTipoChange={setFormularioTipo}
        description="Códigos E-01-10-4, E-01-11-2, E-01-12-0 e E-01-13-9 usam o RCA de dutos/gasodutos. Demais atividades da Listagem E usam o formulário geral."
      />
      {tipo === 'geral' ? <FormListagemEGeral form={form} /> : <FormListagemEDutosGasodutos form={form} />}
    </div>
  );
}
