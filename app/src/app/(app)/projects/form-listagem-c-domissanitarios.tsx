'use client';

import { FormListagemCPrincipal } from './form-listagem-c-principal';
import { FormListagemCSecao6Domissanitarios } from './form-listagem-c-secao6-domissanitarios';
import { FormListagemCDomissanitariosModulo4 } from './form-listagem-c-domissanitarios-modulo4';
import { FormListagemCTecnico } from './form-listagem-c-tecnico';
import { FormListagemCDomissanitariosImpactos } from './form-listagem-c-domissanitarios-impactos';

export function FormListagemCDomissanitarios({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
        Ficha para <strong>Indústrias de produtos domissanitários, sabões, detergentes e preparados para limpeza e
        polimento</strong> (C-04-11-1, C-04-12-1, C-04-13-0), conforme TR RCA — itens 1 a 45.
      </div>
      <FormListagemCPrincipal
        form={form}
        hideEspecifico
        hideLegislacaoMunicipal
        slotSecao6={<FormListagemCSecao6Domissanitarios form={form} />}
        slotModulo4Complemento={<FormListagemCDomissanitariosModulo4 form={form} />}
        slotEspecifico={
          <>
            <FormListagemCTecnico form={form} variant="domissanitarios" />
            <FormListagemCDomissanitariosImpactos form={form} />
          </>
        }
      />
    </div>
  );
}
