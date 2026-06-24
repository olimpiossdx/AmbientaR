'use client';

import * as React from 'react';
import { CoordinateInput } from '@/components/coordinates';
import type { Datum } from '@/lib/types';
import { FormListagemGCampos } from './form-listagem-g-campos';
import { FormListagemGCulturas } from './form-listagem-g-culturas';
import { FormListagemGGeral } from './form-listagem-g-geral';
import { FormListagemGSecao6 } from './form-listagem-g-secao6';
import { FormListagemGShell } from './form-listagem-g-shell';
import { FormListagemGTecnico } from './form-listagem-g-tecnico';
import { ListagemFormularioTipoCard } from './listagem-formulario-tipo-card';
import { useListagemFormularioTipo } from './use-listagem-formulario-tipo';
import {
  LISTAGEM_G_FORM_TIPOS,
  LISTAGEM_G_FORM_CONFIG,
  subatividadeParaFormularioListagemG,
  type ListagemGFormTipo,
} from './listagem-g-form-registry';
import type { Empreendedor } from '@/lib/types';

type FormListagemGProps = {
  form: any;
  empreendedor?: Empreendedor | null;
};

export function FormListagemG({ form, empreendedor }: FormListagemGProps) {
  const { tipo, fieldPath, setFormularioTipo } = useListagemFormularioTipo(form, LISTAGEM_G_FORM_CONFIG);
  const geoDatum = form.watch('geographicLocation.datum') as Datum | undefined;
  const isLegacyDatum =
    geoDatum != null && String(geoDatum).trim() !== '' && geoDatum !== 'SIRGAS2000';

  const onTipoChange = React.useCallback(
    (nextTipo: ListagemGFormTipo) => {
      setFormularioTipo(nextTipo);
      form.setValue('subActivity', subatividadeParaFormularioListagemG(nextTipo), { shouldDirty: true });
    },
    [form, setFormularioTipo],
  );

  return (
    <div className="space-y-6">
      <ListagemFormularioTipoCard<ListagemGFormTipo>
        form={form}
        letter="G"
        fieldPath={fieldPath}
        formTipos={LISTAGEM_G_FORM_TIPOS}
        defaultTipo={LISTAGEM_G_FORM_CONFIG.defaultTipo}
        currentTipo={tipo}
        onTipoChange={onTipoChange}
        description="Sete fichas para atividades agrossilvipastoris (DN 217/17). Informe o código DN na seção 6 para preencher a atividade e selecionar a ficha automaticamente."
      />

      <FormListagemGShell form={form} empreendedor={empreendedor} />

      <FormListagemGSecao6 form={form} />

      <CoordinateInput
        form={form}
        basePath="geographicLocation"
        variant="full"
        metadataVariant="listagem"
        title="5. Localização Geográfica"
        lockDatum={!isLegacyDatum}
        showLegacyDatums={isLegacyDatum}
      />

      {tipo === 'culturas' && <FormListagemGCulturas form={form} />}
      {tipo !== 'culturas' && tipo !== 'geral' && (
        <>
          <FormListagemGCampos form={form} tipo={tipo} />
          <FormListagemGTecnico form={form} />
        </>
      )}
      {tipo === 'geral' && <FormListagemGGeral form={form} />}
    </div>
  );
}
