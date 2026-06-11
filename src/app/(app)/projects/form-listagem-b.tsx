'use client';

import { FormListagemBPrincipal } from './form-listagem-b-principal';
import { FormListagemBFerroligas } from './form-listagem-b-ferroligas';
import { FormListagemBFundidosFerroAco } from './form-listagem-b-fundidos-ferro-aco';
import { FormListagemBNaoFerrosos } from './form-listagem-b-nao-ferrosos';
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
        description="Ferroligas (B-03-04-2), fundidos de ferro/aço (B-03-07-7, B-03-08-5) e não ferrosos (B-04-04-9, B-04-05-7) têm fichas específicas. Demais atividades usam o formulário principal ou o geral."
      />
      {tipo === 'geral' ? (
        <FormListagemBGeral form={form} />
      ) : tipo === 'ferroligas' ? (
        <FormListagemBFerroligas form={form} />
      ) : tipo === 'fundidos_ferro_aco' ? (
        <FormListagemBFundidosFerroAco form={form} />
      ) : tipo === 'fundidos_nao_ferrosos' ? (
        <FormListagemBNaoFerrosos form={form} />
      ) : (
        <FormListagemBPrincipal form={form} />
      )}
    </div>
  );
}
