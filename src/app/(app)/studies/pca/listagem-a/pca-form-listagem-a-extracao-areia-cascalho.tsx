'use client';

import type { UseFormReturn } from 'react-hook-form';
import {
  PcaBooleanRadio,
  PcaSectionCard,
  PcaTextAreaField,
  PcaTextField,
} from './pca-form-listagem-a-helpers';
import { PcaFormListagemAFichaMinerariaCompleta } from './pca-form-listagem-a-ficha-completa';

/** Ficha PCA — extração de areia, cascalho e argila (sem ficha dedicada no cadastro de empreendimentos). */
export function PcaFormListagemAExtracaoAreiaCascalho({
  form,
}: {
  form: UseFormReturn<any>;
}) {
  return (
    <PcaFormListagemAFichaMinerariaCompleta
      form={form}
      titulo="Extração de areia, cascalho e argila"
      descricao="Listagem A — TR PCA em termos de referencia/…/PCA/pca-extracao-areia-cascalho-argila.doc. Bloco técnico compartilhado (itens 27–59) + campos resumo abaixo."
      extra={
        <PcaSectionCard title="Caracterização da extração (resumo)">
          <PcaTextField
            form={form}
            name="listagemA.extracaoAreiaCascalho.tipoMaterial"
            label="Tipo de material (areia / cascalho / argila)"
          />
          <PcaTextField
            form={form}
            name="listagemA.extracaoAreiaCascalho.metodoExtracao"
            label="Método de extração"
          />
          <PcaTextField
            form={form}
            name="listagemA.extracaoAreiaCascalho.producaoEstimada"
            label="Produção estimada"
          />
          <PcaTextField
            form={form}
            name="listagemA.extracaoAreiaCascalho.areaUtilHa"
            label="Área útil (ha)"
          />
          <PcaTextField
            form={form}
            name="listagemA.extracaoAreiaCascalho.destinoProduto"
            label="Destino do produto"
          />
          <PcaBooleanRadio
            form={form}
            name="listagemA.extracaoAreiaCascalho.utilizaDetonacao"
            label="Utiliza detonação?"
          />
          <PcaTextAreaField
            form={form}
            name="listagemA.extracaoAreiaCascalho.descricaoOperacional"
            label="Descrição operacional"
          />
        </PcaSectionCard>
      }
    />
  );
}
