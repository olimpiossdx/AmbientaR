'use client';

import { FormListagemBPrincipal } from './form-listagem-b-principal';
import { FormListagemBFerroligasComplemento } from './form-listagem-b-ferroligas-complemento';
import { FormListagemBFerroligasProcessos } from './form-listagem-b-ferroligas-processos';
import { FormListagemBFerroligasAmbiental } from './form-listagem-b-ferroligas-ambiental';
import { FormListagemBFerroligasImpactos } from './form-listagem-b-ferroligas-impactos';

export function FormListagemBFerroligas({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
        Ficha específica para <strong>Produção de ligas ferrosas (ferro ligas)</strong> — Listagem B, código DN{' '}
        <strong>B-03-04-2</strong> (itens 23 a 59). O formulário geral permanece disponível no card acima.
      </div>
      <FormListagemBPrincipal
        form={form}
        hideEspecifico
        slotEspecifico={
          <>
            <FormListagemBFerroligasComplemento form={form} />
            <FormListagemBFerroligasProcessos form={form} />
            <FormListagemBFerroligasAmbiental form={form} />
            <FormListagemBFerroligasImpactos form={form} />
          </>
        }
      />
    </div>
  );
}
