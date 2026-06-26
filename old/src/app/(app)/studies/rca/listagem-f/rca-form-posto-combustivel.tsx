'use client';

import type { Empreendedor as Client, Project } from '@/lib/types';
import { RcaFormListagemFModulo4 } from './rca-form-listagem-f-modulo4';
import { RcaFormListagemFModulos567 } from './rca-form-listagem-f-modulos-567';

export type RcaFormPostoCombustivelProps = {
  form: any;
  clients: Client[];
  isLoadingClients: boolean;
  projects: Project[];
  isLoadingProjects: boolean;
};

export function RcaFormPostoCombustivel({ form }: RcaFormPostoCombustivelProps) {
  return (
    <div className="space-y-6">
      <RcaFormListagemFModulo4 form={form} />
      <RcaFormListagemFModulos567 form={form} />
    </div>
  );
}
