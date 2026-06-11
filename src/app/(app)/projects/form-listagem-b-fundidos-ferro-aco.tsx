'use client';

import { FormListagemBPrincipal } from './form-listagem-b-principal';
import { FormListagemBFundidosComplemento } from './form-listagem-b-fundidos-complemento';
import { FormListagemBProcessos } from './form-listagem-b-processos';
import { FormListagemBAmbiental } from './form-listagem-b-ambiental';
import { FormListagemBFundidosImpactos } from './form-listagem-b-fundidos-impactos';

export function FormListagemBFundidosFerroAco({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
        Ficha específica para <strong>Produção de fundidos de ferro e aço</strong>, com e sem tratamento químico
        superficial, inclusive a partir da reciclagem — Listagem B, TR DN 74/2004 (itens 23 a 62). O formulário geral
        permanece disponível no card acima.
      </div>
      <FormListagemBPrincipal
        form={form}
        hideEspecifico
        slotEspecifico={
          <>
            <FormListagemBFundidosComplemento form={form} />
            <FormListagemBProcessos form={form} />
            <FormListagemBAmbiental form={form} />
            <FormListagemBFundidosImpactos form={form} />
          </>
        }
      />
    </div>
  );
}
