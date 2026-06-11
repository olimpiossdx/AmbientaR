'use client';

import type { Empreendedor as Client, Project } from '@/lib/types';
import { RcaFormListagemECamposEspecificos } from './rca-form-listagem-e-campos';
import { RcaFormListagemETecnico } from './rca-form-listagem-e-tecnico';
import type { RcaListagemEFormTipo } from './rca-listagem-e-registry';

export type RcaFormListagemEActivityProps = {
  form: any;
  clients: Client[];
  isLoadingClients: boolean;
  projects: Project[];
  isLoadingProjects: boolean;
};

function RcaFormListagemEActivity({
  tipo,
  ...props
}: RcaFormListagemEActivityProps & { tipo: RcaListagemEFormTipo }) {
  return (
    <div className="space-y-4">
      <RcaFormListagemECamposEspecificos form={props.form} tipo={tipo} />
      <RcaFormListagemETecnico {...props} />
    </div>
  );
}

export const RcaFormRodovias = (p: RcaFormListagemEActivityProps) => (
  <RcaFormListagemEActivity tipo="rodovias" {...p} />
);
export const RcaFormGasoduto = (p: RcaFormListagemEActivityProps) => (
  <RcaFormListagemEActivity tipo="gasoduto" {...p} />
);
export const RcaFormRecapacitacaoCghPch = (p: RcaFormListagemEActivityProps) => (
  <RcaFormListagemEActivity tipo="recapacitacao_cgh_pch" {...p} />
);
export const RcaFormBiogasAterro = (p: RcaFormListagemEActivityProps) => (
  <RcaFormListagemEActivity tipo="biogas_aterro" {...p} />
);
export const RcaFormBiometanizacaoRsu = (p: RcaFormListagemEActivityProps) => (
  <RcaFormListagemEActivity tipo="biometanizacao_rsu" {...p} />
);
export const RcaFormTratamentoTermicoRsu = (p: RcaFormListagemEActivityProps) => (
  <RcaFormListagemEActivity tipo="tratamento_termico_rsu" {...p} />
);
export const RcaFormBarragemSaneamento = (p: RcaFormListagemEActivityProps) => (
  <RcaFormListagemEActivity tipo="barragem_saneamento" {...p} />
);
export const RcaFormAbastecimentoAgua = (p: RcaFormListagemEActivityProps) => (
  <RcaFormListagemEActivity tipo="abastecimento_agua" {...p} />
);
export const RcaFormEsgotamentoSanitario = (p: RcaFormListagemEActivityProps) => (
  <RcaFormListagemEActivity tipo="esgotamento_sanitario" {...p} />
);
export const RcaFormTratamentoRsu = (p: RcaFormListagemEActivityProps) => (
  <RcaFormListagemEActivity tipo="tratamento_rsu" {...p} />
);
export const RcaFormSoloUrbano = (p: RcaFormListagemEActivityProps) => (
  <RcaFormListagemEActivity tipo="solo_urbano" {...p} />
);
export const RcaFormDragagem = (p: RcaFormListagemEActivityProps) => (
  <RcaFormListagemEActivity tipo="dragagem" {...p} />
);
