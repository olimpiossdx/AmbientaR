'use client';

import type { UseFormReturn } from 'react-hook-form';
import {
  RcaBooleanRadio,
  RcaSectionCard,
  RcaTextAreaField,
  RcaTextField,
} from './rca-form-listagem-a-helpers';
import { RcaFormLavraSubterranea } from './rca-form-lavra-subterranea';

type RcaFormExtracaoAreiaCascalhoProps = {
  form: UseFormReturn<any>;
};

export function RcaFormExtracaoAreiaCascalho({ form }: RcaFormExtracaoAreiaCascalhoProps) {

  return (
    <div className="space-y-4">
      <RcaSectionCard
        title="Caracterização da extração (Listagem A)"
        description="Campos específicos para extração de areia, cascalho e argila — complementam os módulos 1–7 do RCA minerário."
      >
        <RcaTextField
          form={form}
          name="listagemA.extracaoAreiaCascalho.tipoMaterial"
          label="Tipo de material (areia / cascalho / argila)"
        />
        <RcaTextField
          form={form}
          name="listagemA.extracaoAreiaCascalho.metodoExtracao"
          label="Método de extração"
        />
        <RcaTextField
          form={form}
          name="listagemA.extracaoAreiaCascalho.producaoEstimada"
          label="Produção estimada"
        />
        <RcaTextField
          form={form}
          name="listagemA.extracaoAreiaCascalho.areaUtilHa"
          label="Área útil (ha)"
        />
        <RcaTextField
          form={form}
          name="listagemA.extracaoAreiaCascalho.destinoProduto"
          label="Destino do produto"
        />
        <RcaBooleanRadio
          form={form}
          name="listagemA.extracaoAreiaCascalho.extracaoEmCorpoDagua"
          label="Extração em corpo d'água?"
        />
        <RcaTextAreaField
          form={form}
          name="listagemA.extracaoAreiaCascalho.medidasControle"
          label="Medidas de controle ambiental"
        />
      </RcaSectionCard>
      <RcaFormLavraSubterranea form={form} />
    </div>
  );
}
