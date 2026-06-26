'use client';

import { FormListagemCPrincipal } from './form-listagem-c-principal';
import { FormListagemCSecao6Plasticos } from './form-listagem-c-secao6-plasticos';
import { FormListagemCPlasticosModulo4 } from './form-listagem-c-plasticos-modulo4';
import { FormListagemCPlasticosTecnico } from './form-listagem-c-plasticos-tecnico';
import { FormListagemCPlasticosImpactos } from './form-listagem-c-plasticos-impactos';

export function FormListagemCPlasticos({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
        Ficha para <strong>Indústria de plásticos</strong> (moldagem C-07-* e reciclagem F-05-*), conforme TR RCA para
        indústria de plásticos — itens 1 a 57.
      </div>
      <FormListagemCPrincipal
        form={form}
        hideEspecifico
        hideLegislacaoMunicipal
        slotSecao6={<FormListagemCSecao6Plasticos form={form} />}
        slotModulo4Complemento={<FormListagemCPlasticosModulo4 form={form} />}
        slotEspecifico={
          <>
            <FormListagemCPlasticosTecnico form={form} />
            <FormListagemCPlasticosImpactos form={form} />
          </>
        }
      />
    </div>
  );
}
