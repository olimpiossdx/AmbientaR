'use client';

import { FormListagemAPrincipal } from './form-listagem-a-principal';
import { FormListagemARochasOrnamentaisComplemento } from './form-listagem-a-rochas-ornamentais-complemento';
import { FormListagemARochasOrnamentaisTecnico } from './form-listagem-a-rochas-ornamentais-tecnico';

export function FormListagemARochasOrnamentais({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
        Ficha específica para <strong>Lavra de rochas ornamentais e de revestimento</strong> (ardósias, mármores,
        granitos e quartzitos) — Listagem A, TR DN 74/2004. O formulário geral permanece disponível no card acima.
      </div>
      <FormListagemAPrincipal
        form={form}
        hideTecnico
        slotAntesTecnico={
          <>
            <FormListagemARochasOrnamentaisComplemento form={form} />
            <FormListagemARochasOrnamentaisTecnico form={form} />
          </>
        }
      />
    </div>
  );
}
