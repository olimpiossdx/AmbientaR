'use client';

import type { Empreendedor as Client, Project } from '@/lib/types';
import { RcaFormListagemGCamposEspecificos } from './rca-form-listagem-g-campos';
import { RcaFormListagemGTecnico } from './rca-form-listagem-g-tecnico';
import { RcaFormCulturas } from './rca-form-culturas';
import type { RcaListagemGFormTipo } from './rca-listagem-g-registry';

export type RcaFormListagemGActivityProps = {
  form: any;
  clients: Client[];
  isLoadingClients: boolean;
  projects: Project[];
  isLoadingProjects: boolean;
};

function RcaFormListagemGActivity({
  tipo,
  ...props
}: RcaFormListagemGActivityProps & { tipo: RcaListagemGFormTipo }) {
  if (tipo === 'culturas') {
    return <RcaFormCulturas {...props} />;
  }
  return (
    <div className="space-y-4">
      <RcaFormListagemGCamposEspecificos form={props.form} tipo={tipo} />
      <RcaFormListagemGTecnico {...props} />
    </div>
  );
}

export const RcaFormCulturasListagemG = (p: RcaFormListagemGActivityProps) => (
  <RcaFormListagemGActivity tipo="culturas" {...p} />
);
export const RcaFormBovinocultura = (p: RcaFormListagemGActivityProps) => (
  <RcaFormListagemGActivity tipo="bovinocultura" {...p} />
);
export const RcaFormIrrigados = (p: RcaFormListagemGActivityProps) => (
  <RcaFormListagemGActivity tipo="irrigados" {...p} />
);
export const RcaFormSilvicultura = (p: RcaFormListagemGActivityProps) => (
  <RcaFormListagemGActivity tipo="silvicultura" {...p} />
);
export const RcaFormGraos = (p: RcaFormListagemGActivityProps) => (
  <RcaFormListagemGActivity tipo="graos" {...p} />
);
export const RcaFormSuinocultura = (p: RcaFormListagemGActivityProps) => (
  <RcaFormListagemGActivity tipo="suinocultura" {...p} />
);
export const RcaFormAvicultura = (p: RcaFormListagemGActivityProps) => (
  <RcaFormListagemGActivity tipo="avicultura" {...p} />
);
