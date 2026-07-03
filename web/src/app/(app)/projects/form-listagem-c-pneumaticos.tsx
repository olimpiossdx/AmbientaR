'use client';

import { FormListagemCPrincipal } from './form-listagem-c-principal';
import { FormListagemCTecnico } from './form-listagem-c-tecnico';
import { FormListagemCImpactos } from './form-listagem-c-impactos';

export function FormListagemCPneumaticos({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
        Ficha para <strong>Indústria da borracha – pneumáticos</strong> (fabricação C-02-02-1 e recauchutagem C-02-03-8),
        conforme TR RCA para indústrias de pneumáticos — itens 1 a 44. O formulário geral permanece disponível no card
        acima.
      </div>
      <FormListagemCPrincipal
        form={form}
        hideEspecifico
        slotEspecifico={
          <>
            <FormListagemCTecnico form={form} />
            <FormListagemCImpactos form={form} />
          </>
        }
      />
    </div>
  );
}
