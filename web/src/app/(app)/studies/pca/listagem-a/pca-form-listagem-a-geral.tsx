'use client';

import type { UseFormReturn } from 'react-hook-form';
import { PcaFormListagemAFichaMinerariaCompleta } from './pca-form-listagem-a-ficha-completa';

/** PCA geral — demais códigos da Listagem A sem ficha TR específica. */
export function PcaFormListagemAGeral({ form }: { form: UseFormReturn<any> }) {
  return (
    <PcaFormListagemAFichaMinerariaCompleta
      form={form}
      titulo="PCA geral — Listagem A"
      descricao="Atividades minerárias sem ficha PCA dedicada. Utiliza regularização ambiental (Módulo 2) e detalhamento técnico padrão (itens 27–59)."
    />
  );
}
