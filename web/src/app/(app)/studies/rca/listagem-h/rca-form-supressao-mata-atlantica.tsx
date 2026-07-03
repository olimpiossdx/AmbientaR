'use client';

import type { Empreendedor as Client, Project } from '@/lib/types';
import { RcaFormListagemHCamposSupressao } from './rca-form-listagem-h-campos';
import { RcaFormListagemHTecnico } from './rca-form-listagem-h-tecnico';

export type RcaFormSupressaoMataAtlanticaProps = {
  form: any;
  clients: Client[];
  isLoadingClients: boolean;
  projects: Project[];
  isLoadingProjects: boolean;
};

export function RcaFormSupressaoMataAtlantica({ form }: RcaFormSupressaoMataAtlanticaProps) {
  return (
    <div className="space-y-6">
      <RcaFormListagemHCamposSupressao form={form} />
      <RcaFormListagemHTecnico form={form} />
    </div>
  );
}
