'use client';

import { FormListagemCPrincipal } from './form-listagem-c-principal';
import { FormListagemCSecao6Papel } from './form-listagem-c-secao6-papel';
import { FormListagemCPapelModulo4 } from './form-listagem-c-papel-modulo4';
import { FormListagemCTecnico } from './form-listagem-c-tecnico';
import { FormListagemCPapelImpactos } from './form-listagem-c-papel-impactos';

export function FormListagemCPapel({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
        Ficha para <strong>Indústrias de papel e papelão</strong> (celulose C-01-01-5, pasta mecânica C-01-02-3, papel
        C-01-03-1), conforme TR RCA — itens 1 a 47.
      </div>
      <FormListagemCPrincipal
        form={form}
        hideEspecifico
        hideLegislacaoMunicipal
        slotSecao6={<FormListagemCSecao6Papel form={form} />}
        slotModulo4Complemento={<FormListagemCPapelModulo4 form={form} />}
        slotEspecifico={
          <>
            <FormListagemCTecnico form={form} variant="papel" />
            <FormListagemCPapelImpactos form={form} />
          </>
        }
      />
    </div>
  );
}
