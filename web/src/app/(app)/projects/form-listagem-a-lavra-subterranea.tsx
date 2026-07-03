'use client';

import { FormListagemAPrincipal } from './form-listagem-a-principal';
import { FormListagemALavraSubterraneaComplemento } from './form-listagem-a-lavra-subterranea-complemento';
import { FormListagemALavraSubterraneaTecnico } from './form-listagem-a-lavra-subterranea-tecnico';

export function FormListagemALavraSubterranea({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
        Ficha específica para <strong>Lavra subterrânea</strong> (Listagem A) — Termo de Referência DN 74/2004,
        itens 9 a 66. O formulário geral permanece disponível como opção alternativa no card acima.
      </div>
      <FormListagemAPrincipal
        form={form}
        hideTecnico
        slotAntesTecnico={
          <>
            <FormListagemALavraSubterraneaComplemento form={form} />
            <FormListagemALavraSubterraneaTecnico form={form} />
          </>
        }
      />
    </div>
  );
}
